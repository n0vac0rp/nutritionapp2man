import json
import time
from pathlib import Path

import torch
import torch.nn as nn
from PIL import Image
from torchvision import models, transforms

MODEL_NAME = "EfficientNet-B0"
IMG_SIZE = 224
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

_model = None
_class_names: list[str] = []
_startup_timestamp: str = ""

_transform = transforms.Compose(
    [
        transforms.Resize((IMG_SIZE, IMG_SIZE)),
        transforms.ToTensor(),
        transforms.Normalize(
            mean=[0.485, 0.456, 0.406],
            std=[0.229, 0.224, 0.225],
        ),
    ]
)


def load_model(model_path: str, class_names_path: str) -> None:
    global _model, _class_names, _startup_timestamp

    with open(class_names_path) as f:
        _class_names = json.load(f)

    model = models.efficientnet_b0(weights=None)
    num_classes = len(_class_names)

    for param in model.features.parameters():
        param.requires_grad = False

    in_features = model.classifier[1].in_features
    model.classifier[1] = nn.Linear(in_features, num_classes)

    state_dict = torch.load(model_path, map_location=DEVICE, weights_only=True)
    model.load_state_dict(state_dict)
    model.to(DEVICE)
    model.eval()

    _model = model
    _startup_timestamp = _utcnow()
    print(f"Model loaded: {MODEL_NAME}, {num_classes} classes on {DEVICE}")


def is_loaded() -> bool:
    return _model is not None


def get_classes() -> list[str]:
    return list(_class_names)


def get_startup_timestamp() -> str:
    return _startup_timestamp


def predict(image: Image.Image) -> dict:
    if _model is None:
        raise RuntimeError("Model not loaded")

    tensor = _transform(image).unsqueeze(0).to(DEVICE)

    start = time.perf_counter()
    with torch.no_grad():
        outputs = _model(tensor)
        probabilities = torch.nn.functional.softmax(outputs, dim=1)
    elapsed_ms = (time.perf_counter() - start) * 1000

    probs: list[float] = probabilities[0].tolist()
    indexed: list[tuple[int, float]] = sorted(
        enumerate(probs), key=lambda x: x[1], reverse=True
    )

    predictions = [
        {"class_name": _class_names[i], "confidence": round(conf, 4)}
        for i, conf in indexed
    ]

    return {
        "predictions": predictions,
        "top_prediction": predictions[0],
        "inference_time_ms": round(elapsed_ms, 2),
    }


def _utcnow() -> str:
    from datetime import datetime, timezone

    return datetime.now(timezone.utc).isoformat()
