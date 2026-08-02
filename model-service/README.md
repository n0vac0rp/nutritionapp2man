# GluGuide Food Classifier — Model Service

FastAPI microservice that classifies Nigerian starchy foods using a trained EfficientNet-B0 model.

## Architecture

- **Base model:** EfficientNet-B0 (pretrained on ImageNet), transfer learned
- **Input:** 224×224 RGB image
- **Preprocessing:** Resize → ToTensor → ImageNet normalization
- **Output:** 4 classes with softmax confidence scores
- **Classes:** Amala, Eba, Pounded Yam, Semo

## Requirements

- Python 3.12+
- Virtual environment (recommended)

## Setup

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

## Run

```bash
source venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 3002
```

Or with hot reload:

```bash
uvicorn app.main:app --host 0.0.0.0 --port 3002 --reload
```

## Configuration

Copy `.env.example` to `.env` and adjust as needed:

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3002` | Server port |
| `MODEL_PATH` | `./models/food_classifier.pth` | Path to PyTorch weights |
| `CLASS_NAMES_PATH` | `./models/class_names.json` | Path to class labels |

## API Endpoints

### GET /health

Returns service status and model information.

**Response:**
```json
{
  "status": "ok",
  "model_loaded": true,
  "model_name": "EfficientNet-B0",
  "classes": ["Amala", "Eba", "Pounded Yam", "Semo"],
  "startup_timestamp": "2026-08-01T15:26:44.920212+00:00"
}
```

### POST /predict

Classify a food image. Accepts `multipart/form-data` with a `file` field.

**Request:**
```bash
curl -X POST http://localhost:3002/predict \
  -F "file=@food_image.jpg"
```

**Response:**
```json
{
  "predictions": [
    { "class_name": "Amala", "confidence": 0.6466 },
    { "class_name": "Eba", "confidence": 0.3050 },
    { "class_name": "Pounded Yam", "confidence": 0.0457 },
    { "class_name": "Semo", "confidence": 0.0027 }
  ],
  "top_prediction": {
    "class_name": "Amala",
    "confidence": 0.6466
  },
  "inference_time_ms": 281.74
}
```

### Constraints

- Maximum file size: 10 MB
- Accepted formats: JPEG, PNG, WebP
- Predictions are sorted by descending confidence

## Project Structure

```
model-service/
├── app/
│   ├── main.py              # FastAPI app, lifespan, server entry
│   ├── api/
│   │   └── routes.py        # /health, /predict endpoints
│   ├── core/
│   │   └── config.py        # Settings from env vars
│   ├── services/
│   │   └── classifier.py    # Model loading, preprocessing, inference
│   └── schemas/
│       └── prediction.py    # Pydantic response models
├── models/
│   ├── food_classifier.pth  # Trained model weights (16.3 MB)
│   └── class_names.json     # Class label mapping
├── requirements.txt
├── .env.example
└── README.md
```
