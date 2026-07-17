from typing import Optional, List
from pydantic import BaseModel, Field


class DetectAnomalyRequest(BaseModel):
    siteId: int
    typeEnergie: str
    quantite: float
    historique: List[float] = Field(default_factory=list)


class DetectAnomalyResponse(BaseModel):
    anomalie: bool
    severite: Optional[str] = None  # "FAIBLE" | "MOYENNE" | "CRITIQUE"
    description: Optional[str] = None
    score: Optional[float] = None


class PredictRequest(BaseModel):
    siteId: Optional[int] = None
    typeEnergie: Optional[str] = None
    horizonMonths: Optional[int] = 3


class PredictionPoint(BaseModel):
    month: str
    actual: Optional[float] = None
    predicted: float
    lower: float
    upper: float
