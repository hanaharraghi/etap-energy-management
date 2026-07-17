import logging
import numpy as np
from sklearn.ensemble import IsolationForest

from .schemas import DetectAnomalyRequest, DetectAnomalyResponse

logger = logging.getLogger("etap-ai.anomaly")

MIN_POINTS_FOR_ISOLATION_FOREST = 8


def detect_anomaly(payload: DetectAnomalyRequest) -> DetectAnomalyResponse:
    """
    Two-tier approach, chosen deliberately rather than always using one method:

    - With >= 8 historical points: IsolationForest, an unsupervised sklearn
      model well suited to this exact shape of problem (flagging a new point
      as anomalous relative to a distribution) without needing labeled
      training data, which we don't have.
    - With fewer points (the common case early on, before much invoice
      history has accumulated): IsolationForest is unreliable on tiny
      samples, so we fall back to a modified z-score (median/MAD based,
      more robust to outliers in a short history than mean/stdev) — this is
      a legitimate statistical method, not a placeholder.
    """
    historique = [h for h in payload.historique if h is not None]

    if len(historique) < 2:
        return DetectAnomalyResponse(
            anomalie=False,
            description="Historique insuffisant pour évaluer une anomalie (moins de 2 factures précédentes).",
        )

    if len(historique) >= MIN_POINTS_FOR_ISOLATION_FOREST:
        return _detect_with_isolation_forest(historique, payload.quantite)
    return _detect_with_modified_zscore(historique, payload.quantite)


def _detect_with_isolation_forest(historique, quantite):
    X = np.array(historique + [quantite]).reshape(-1, 1)
    model = IsolationForest(n_estimators=100, contamination="auto", random_state=42)
    model.fit(X)
    scores = model.decision_function(X)
    predictions = model.predict(X)

    current_score = float(scores[-1])
    is_anomaly = predictions[-1] == -1

    if not is_anomaly:
        return DetectAnomalyResponse(anomalie=False, score=current_score)

    mean_hist = float(np.mean(historique))
    pct_deviation = ((quantite - mean_hist) / mean_hist * 100) if mean_hist != 0 else 0
    severite = _severity_from_deviation(abs(pct_deviation))

    return DetectAnomalyResponse(
        anomalie=True,
        severite=severite,
        score=current_score,
        description=(
            f"Consommation de {quantite:.0f} détectée comme anomalie par IsolationForest "
            f"(écart de {pct_deviation:+.0f}% par rapport à la moyenne historique de {mean_hist:.0f})."
        ),
    )


def _detect_with_modified_zscore(historique, quantite):
    median = float(np.median(historique))
    mad = float(np.median(np.abs(np.array(historique) - median)))

    if mad == 0:
        deviation = abs(quantite - median)
        is_anomaly = deviation > max(median * 0.3, 1.0)
        modified_z = None
    else:
        modified_z = 0.6745 * (quantite - median) / mad
        is_anomaly = abs(modified_z) > 3.5

    if not is_anomaly:
        return DetectAnomalyResponse(anomalie=False, score=modified_z)

    pct_deviation = ((quantite - median) / median * 100) if median != 0 else 0
    severite = _severity_from_deviation(abs(pct_deviation))

    return DetectAnomalyResponse(
        anomalie=True,
        severite=severite,
        score=modified_z,
        description=(
            f"Consommation de {quantite:.0f} détectée comme anomalie (méthode z-score modifié, "
            f"historique court : {len(historique)} factures) — écart de {pct_deviation:+.0f}% "
            f"par rapport à la médiane de {median:.0f}."
        ),
    )


def _severity_from_deviation(pct_deviation: float) -> str:
    if pct_deviation >= 60:
        return "CRITIQUE"
    if pct_deviation >= 30:
        return "MOYENNE"
    return "FAIBLE"
