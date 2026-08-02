from pydantic import BaseModel


class Prediction(BaseModel):
    class_name: str
    confidence: float


class PredictResponse(BaseModel):
    predictions: list[Prediction]
    top_prediction: Prediction
    inference_time_ms: float


class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    model_name: str
    classes: list[str]
    startup_timestamp: str
