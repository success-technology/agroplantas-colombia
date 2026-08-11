from typing import List, Optional

from pydantic import BaseModel


class Probability(BaseModel):
    className: str
    probability: float


class EnvironmentalFactors(BaseModel):
    temperature: str
    humidity: str
    sunlight: str


class PlantInfo(BaseModel):
    """Ficha agronómica completa para el agricultor."""
    title: str
    description: str
    severity: str  # low | medium | high

    plantType: str
    scientificName: Optional[str] = None
    category: str
    healthStatus: str
    condition: str

    hasPest: bool
    hasDisease: bool
    pestOrDiseaseName: Optional[str] = None

    treatment: List[str]
    possibleCauses: List[str]
    season: str
    colombiaRegions: List[str]
    prevention: List[str]
    actions: List[str]

    environmental: EnvironmentalFactors
    additionalNotes: Optional[str] = None


# Alias para compatibilidad interna
Recommendation = PlantInfo


class AnalysisSummary(BaseModel):
    recognized: bool = True
    speciesName: str
    speciesConfidence: float
    statusLabel: str
    conditionShort: str
    isHealthy: bool
    hasPest: bool
    hasDisease: bool
    uncertain: bool = False
    alternativeSpecies: List[dict] = []
    supportedSpecies: List[str] = []
    rejectionReason: Optional[str] = None
    weakGuessSpecies: Optional[str] = None
    weakGuessConfidence: Optional[float] = None


class PredictionResult(BaseModel):
    className: str
    confidence: float
    probabilities: List[Probability]
    analysis: AnalysisSummary
    plantInfo: PlantInfo
    recommendations: PlantInfo
    lowConfidence: bool = False


class PredictionResponse(BaseModel):
    success: bool
    prediction: Optional[PredictionResult] = None
    error: Optional[str] = None
    processingTime: float
