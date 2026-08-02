from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI

from app.api.routes import router
from app.core.config import settings
from app.services.classifier import load_model


@asynccontextmanager
async def lifespan(app: FastAPI):
    load_model(settings.model_path, settings.class_names_path)
    yield


app = FastAPI(title="GluGuide Food Classifier", version="0.1.0", lifespan=lifespan)

app.include_router(router)


if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=settings.port, reload=True)
