import sys
import os
from datetime import datetime

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.forecasting import _predict_with_linear_trend, _add_months


def test_linear_trend_produces_correct_point_count():
    rows = [
        {"month": datetime(2026, 1, 1), "total": 1000},
        {"month": datetime(2026, 2, 1), "total": 1100},
        {"month": datetime(2026, 3, 1), "total": 1200},
    ]
    result = _predict_with_linear_trend(rows, horizon=3)
    # 3 historical points + 3 forecast points
    assert len(result) == 6


def test_linear_trend_future_points_have_no_actual():
    rows = [
        {"month": datetime(2026, 1, 1), "total": 1000},
        {"month": datetime(2026, 2, 1), "total": 1100},
    ]
    result = _predict_with_linear_trend(rows, horizon=2)
    future_points = result[len(rows) :]
    assert all(p.actual is None for p in future_points)
    assert all(p.predicted > 0 for p in future_points)


def test_linear_trend_confidence_band_widens_with_horizon():
    rows = [
        {"month": datetime(2026, 1, 1), "total": 1000},
        {"month": datetime(2026, 2, 1), "total": 1050},
    ]
    result = _predict_with_linear_trend(rows, horizon=4)
    future_points = result[len(rows) :]
    spreads = [p.upper - p.lower for p in future_points]
    # each subsequent forecast month should have an equal or wider band
    assert all(spreads[i] <= spreads[i + 1] for i in range(len(spreads) - 1))


def test_add_months_rolls_over_year_boundary():
    result = _add_months(datetime(2026, 11, 1), 3)
    assert result.year == 2027
    assert result.month == 2
