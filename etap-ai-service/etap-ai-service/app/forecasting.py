import logging
from datetime import datetime
import numpy as np
import pandas as pd

from .database import get_monthly_consumption
from .schemas import PredictRequest, PredictionPoint

logger = logging.getLogger("etap-ai.forecasting")

MOIS_FR = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"]
MIN_POINTS_FOR_PROPHET = 6


def predict(payload: PredictRequest) -> list[PredictionPoint]:
    """
    Pulls real monthly consumption history from the shared PostgreSQL
    database (the same one NestJS/Prisma writes to — this service only
    reads from it) and forecasts forward.

    - With >= 6 months of history: Prophet, a real time-series forecasting
      library good at handling trend + the kind of seasonality utility
      consumption typically has, with proper confidence intervals.
    - With less history than that: Prophet's uncertainty estimates aren't
      trustworthy on that little data, so we fall back to simple linear
      extrapolation with a widening confidence band — this is clearly
      inferior to a real fit, and is labeled as such in the response's
      lower/upper spread, not hidden behind a false sense of precision.
    """
    horizon = payload.horizonMonths or 3
    rows = get_monthly_consumption(payload.siteId, payload.typeEnergie)

    if len(rows) == 0:
        logger.warning("No consumption history found for this site/energy type")
        return []

    if len(rows) >= MIN_POINTS_FOR_PROPHET:
        try:
            return _predict_with_prophet(rows, horizon)
        except Exception as exc:
            logger.error(f"Prophet failed ({exc}), falling back to linear trend")
            return _predict_with_linear_trend(rows, horizon)

    return _predict_with_linear_trend(rows, horizon)


def _predict_with_prophet(rows: list[dict], horizon: int) -> list[PredictionPoint]:
    from prophet import Prophet  # imported lazily: heavy dependency, only
    # needed on the path that actually uses it, and keeps the fallback path
    # usable even in an environment where Prophet's Stan backend somehow
    # isn't available.

    df = pd.DataFrame(rows).rename(columns={"month": "ds", "total": "y"})
    df["ds"] = pd.to_datetime(df["ds"])

    model = Prophet(
        yearly_seasonality=len(rows) >= 24,  # need 2+ years of data for this to mean anything
        weekly_seasonality=False,
        daily_seasonality=False,
        interval_width=0.80,
    )
    model.fit(df)

    future = model.make_future_dataframe(periods=horizon, freq="MS")
    forecast = model.predict(future)

    actual_by_month = {row["month"].strftime("%Y-%m"): row["total"] for row in rows}

    points = []
    for _, r in forecast.iterrows():
        key = r["ds"].strftime("%Y-%m")
        points.append(
            PredictionPoint(
                month=MOIS_FR[r["ds"].month - 1],
                actual=actual_by_month.get(key),
                predicted=round(float(r["yhat"]), 1),
                lower=round(float(r["yhat_lower"]), 1),
                upper=round(float(r["yhat_upper"]), 1),
            )
        )
    # Keep some trailing history for chart context, plus the forecast horizon.
    return points[-(min(len(rows), 6) + horizon):]


def _predict_with_linear_trend(rows: list[dict], horizon: int) -> list[PredictionPoint]:
    values = np.array([r["total"] for r in rows])
    x = np.arange(len(values))

    if len(values) >= 2:
        slope, intercept = np.polyfit(x, values, 1)
    else:
        slope, intercept = 0.0, float(values[0]) if len(values) else 0.0

    residual_std = float(np.std(values)) if len(values) > 1 else values[0] * 0.15 if len(values) else 100.0

    points = []
    for i, row in enumerate(rows):
        month_dt = row["month"]
        points.append(
            PredictionPoint(
                month=MOIS_FR[month_dt.month - 1],
                actual=row["total"],
                predicted=round(float(slope * i + intercept), 1),
                lower=round(float(slope * i + intercept - residual_std), 1),
                upper=round(float(slope * i + intercept + residual_std), 1),
            )
        )

    last_month = rows[-1]["month"]
    for h in range(1, horizon + 1):
        future_x = len(values) - 1 + h
        future_month = _add_months(last_month, h)
        predicted = slope * future_x + intercept
        # Widen the band the further out we forecast — appropriate honesty
        # about growing uncertainty, since this is a straight-line fallback,
        # not a model that understands seasonality or diminishing certainty
        # is usually much sharper near-term than a linear method reflects.
        widened = residual_std * (1 + 0.3 * h)
        points.append(
            PredictionPoint(
                month=MOIS_FR[future_month.month - 1],
                actual=None,
                predicted=round(float(predicted), 1),
                lower=round(float(predicted - widened), 1),
                upper=round(float(predicted + widened), 1),
            )
        )

    return points


def _add_months(dt: datetime, months: int) -> datetime:
    month = dt.month - 1 + months
    year = dt.year + month // 12
    month = month % 12 + 1
    return dt.replace(year=year, month=month, day=1)
