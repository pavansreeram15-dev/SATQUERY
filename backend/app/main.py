import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

from .api.endpoints import router as api_router

app = FastAPI(
    title="SATQUERY AI — Remote Sensing & Geospatial Intelligence API",
    description="Agentic Geospatial Intelligence & Satellite Analysis Platform. "
                "Translates natural language questions into satellite workflows with PostGIS, "
                "Sentinel Hub, Google Earth Engine, ISRO Bhuvan, and Local Processing Engine.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Router
app.include_router(api_router, prefix="/api")

@app.on_event("startup")
async def startup_event():
    """Initialize background disaster telemetry polling."""
    import asyncio
    from .services.disaster_scheduler import disaster_broadcaster
    asyncio.create_task(disaster_broadcaster.start_background_poller())

@app.get("/")
async def root():
    return {
        "message": "SATQUERY AI — Mission Control Subsystem Online",
        "api_docs": "/docs",
        "health_check": "/api/health"
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", os.getenv("API_PORT", 8000)))
    host = os.getenv("API_HOST", "0.0.0.0")
    uvicorn.run("backend.app.main:app", host=host, port=port, reload=True)
