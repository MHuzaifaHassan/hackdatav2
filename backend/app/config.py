import os
from pathlib import Path
from typing import Literal
from pydantic_settings import BaseSettings, SettingsConfigDict


BASE_DIR = Path(__file__).resolve().parent.parent.parent
BACKEND_DIR = Path(__file__).resolve().parent.parent
DOMAINS_DIR = Path(__file__).resolve().parent / "domains"
DATA_OUT_DIR = BASE_DIR / "data_out"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    APP_NAME: str = "Synthetic Data Platform"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = False

    # LLM Settings
    LLM_PROVIDER: Literal["mock", "gemini", "openai", "anthropic"] = "mock"
    GEMINI_API_KEY: str = ""
    OPENAI_API_KEY: str = ""
    ANTHROPIC_API_KEY: str = ""
    DEFAULT_LLM_MODEL: str = "gemini-1.5-flash"

    # Engine Defaults
    DEFAULT_SEED: int = 42
    DEFAULT_LOCALE: str = "en_US"
    DEFAULT_CURRENCY: str = "USD"
    MAX_ROWS_PER_TABLE: int = 100_000

    # Paths
    BASE_DIR: Path = BASE_DIR
    BACKEND_DIR: Path = BACKEND_DIR
    DOMAINS_DIR: Path = DOMAINS_DIR
    DATA_OUT_DIR: Path = DATA_OUT_DIR


settings = Settings()
DATA_OUT_DIR.mkdir(parents=True, exist_ok=True)
