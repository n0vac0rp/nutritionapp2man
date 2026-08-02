from io import BytesIO

from fastapi import APIRouter, File, HTTPException, UploadFile
from PIL import Image

from app.schemas.prediction import HealthResponse, PredictResponse
from app.services.classifier import (
    MODEL_NAME,
    get_classes,
    get_startup_timestamp,
    is_loaded,
    predict,
)

router = APIRouter()

IMAGE_EXTS = {"jpeg", "jpg", "png", "webp"}


@router.get("/health", response_model=HealthResponse)
async def health():
    return HealthResponse(
        status="ok" if is_loaded() else "degraded",
        model_loaded=is_loaded(),
        model_name=MODEL_NAME,
        classes=get_classes(),
        startup_timestamp=get_startup_timestamp(),
    )


@router.post("/predict", response_model=PredictResponse)
async def predict_endpoint(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")

    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
    if ext not in IMAGE_EXTS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported image format '.{ext}'. Accepted: {', '.join(sorted(IMAGE_EXTS))}",
        )

    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Image exceeds 10 MB limit")

    try:
        image = Image.open(BytesIO(contents)).convert("RGB")
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid or corrupted image file")

    result = predict(image)
    return PredictResponse(**result)
