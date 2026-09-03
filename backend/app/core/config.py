import os
from typing import List
from pydantic import BaseModel, Field

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

class Settings(BaseModel):
    PROJECT_NAME: str = "SATQUERY AI"
    PROJECT_DESCRIPTION: str = "Remote Sensing & Geospatial Intelligence API Subsystem"
    VERSION: str = "1.0.0"

    API_PORT: int = Field(default_factory=lambda: int(os.getenv("PORT", os.getenv("API_PORT", 8000))))
    API_HOST: str = Field(default_factory=lambda: os.getenv("API_HOST", "0.0.0.0"))

    # External Provider Keys & Auth
    BHUVAN_API_KEY: str = Field(default_factory=lambda: os.getenv("BHUVAN_API_KEY", "").strip())
    SENTINELHUB_CLIENT_ID: str = Field(default_factory=lambda: os.getenv("SENTINELHUB_CLIENT_ID", "").strip())
    SENTINELHUB_CLIENT_SECRET: str = Field(default_factory=lambda: os.getenv("SENTINELHUB_CLIENT_SECRET", "").strip())
    GEE_PROJECT_ID: str = Field(default_factory=lambda: os.getenv("GEE_PROJECT_ID", "").strip())
    GEE_SERVICE_ACCOUNT: str = Field(default_factory=lambda: os.getenv("GEE_SERVICE_ACCOUNT", "").strip())
    GEMINI_API_KEY: str = Field(default_factory=lambda: os.getenv("GEMINI_API_KEY", "").strip())
    FIRMS_MAP_KEY: str = Field(default_factory=lambda: os.getenv("FIRMS_MAP_KEY", "").strip())

    # Operations & Fallbacks
    LOCAL_PROCESSING: bool = Field(default_factory=lambda: os.getenv("LOCAL_PROCESSING", "false").lower() in ("true", "1", "yes"))
    
    CORS_ORIGINS: List[str] = ["*"]

settings = Settings()
