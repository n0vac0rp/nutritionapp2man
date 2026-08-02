from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    port: int = 3002
    model_path: str = "./models/food_classifier.pth"
    class_names_path: str = "./models/class_names.json"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
