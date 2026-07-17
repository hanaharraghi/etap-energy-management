import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.anomaly import detect_anomaly
from app.schemas import DetectAnomalyRequest


def test_no_history_never_flags():
    result = detect_anomaly(
        DetectAnomalyRequest(
            siteId=1, typeEnergie="ELECTRICITE", quantite=2000, historique=[]
        )
    )
    assert result.anomalie is False
    assert "insuffisant" in result.description.lower()


def test_sparse_history_normal_value_not_flagged():
    result = detect_anomaly(
        DetectAnomalyRequest(
            siteId=1,
            typeEnergie="ELECTRICITE",
            quantite=2100,
            historique=[2000, 2050, 2080],
        )
    )
    assert result.anomalie is False


def test_sparse_history_extreme_value_flagged():
    result = detect_anomaly(
        DetectAnomalyRequest(
            siteId=1,
            typeEnergie="ELECTRICITE",
            quantite=5000,
            historique=[2000, 2050, 2080],
        )
    )
    assert result.anomalie is True
    assert result.severite == "CRITIQUE"


def test_rich_history_uses_isolation_forest_normal_value():
    hist = [2000, 2050, 2020, 2080, 2100, 2060, 2090, 2110, 2070]
    result = detect_anomaly(
        DetectAnomalyRequest(
            siteId=1, typeEnergie="ELECTRICITE", quantite=2085, historique=hist
        )
    )
    assert result.anomalie is False


def test_rich_history_uses_isolation_forest_anomaly():
    hist = [2000, 2050, 2020, 2080, 2100, 2060, 2090, 2110, 2070]
    result = detect_anomaly(
        DetectAnomalyRequest(
            siteId=1, typeEnergie="ELECTRICITE", quantite=4500, historique=hist
        )
    )
    assert result.anomalie is True
    assert result.severite in {"MOYENNE", "CRITIQUE"}


def test_severity_scales_with_deviation():
    from app.anomaly import _severity_from_deviation

    assert _severity_from_deviation(10) == "FAIBLE"
    assert _severity_from_deviation(40) == "MOYENNE"
    assert _severity_from_deviation(80) == "CRITIQUE"
