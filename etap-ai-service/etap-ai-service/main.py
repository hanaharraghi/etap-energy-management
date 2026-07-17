import logging
import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.schemas import (
    DetectAnomalyRequest,
    DetectAnomalyResponse,
    PredictRequest,
    PredictionPoint,
)
from app.anomaly import detect_anomaly
from app.forecasting import predict

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("etap-ai")

app = FastAPI(
    title="ETAP AI Service",
    description=(
        "Anomaly detection (scikit-learn) and consumption forecasting "
        "(Prophet) for the ETAP energy management system. Called by the "
        "NestJS backend — not exposed directly to the frontend."
    ),
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    # Only the NestJS backend calls this service — not a browser — so CORS
    # is permissive here by design, unlike the frontend-facing API.
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"service": "etap-ai-service", "status": "ok"}


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/detect-anomaly", response_model=DetectAnomalyResponse)
def detect_anomaly_endpoint(payload: DetectAnomalyRequest):
    try:
        return detect_anomaly(payload)
    except Exception as exc:
        logger.exception("detect-anomaly failed")
        raise HTTPException(status_code=500, detail=str(exc))


@app.post("/predict", response_model=list[PredictionPoint])
def predict_endpoint(payload: PredictRequest):
    try:
        return predict(payload)
    except Exception as exc:
        logger.exception("predict failed")
        raise HTTPException(status_code=500, detail=str(exc))
