from fastapi import APIRouter
from .routes.health import router as health_router
from .routes.satellite import router as satellite_router
from .routes.disasters import router as disasters_router
from .routes.analysis import router as analysis_router
from .routes.change_detection import router as change_detection_router
from .routes.ai import router as ai_router
from .routes.geocoding import router as geocoding_router
from .routes.ais import router as ais_router
from .routes.cables import router as cables_router

router = APIRouter()

# Include all domain-specific routers
router.include_router(health_router)
router.include_router(satellite_router)
router.include_router(disasters_router)
router.include_router(analysis_router)
router.include_router(change_detection_router)
router.include_router(ai_router)
router.include_router(geocoding_router)
router.include_router(ais_router, prefix="/ais", tags=["AIS Maritime Tracking"])
router.include_router(cables_router, prefix="/maritime", tags=["Submarine Cables"])

__all__ = ["router"]
