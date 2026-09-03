import numpy as np
from typing import Dict, Any, Tuple

def compute_ndvi(nir_band: np.ndarray, red_band: np.ndarray) -> np.ndarray:
    """
    Calculate Normalized Difference Vegetation Index (NDVI)
    NDVI = (NIR - RED) / (NIR + RED)
    Range: -1.0 to +1.0
    """
    nir = nir_band.astype(np.float32)
    red = red_band.astype(np.float32)
    denominator = nir + red
    # Avoid zero division
    denominator[denominator == 0] = 1e-6
    ndvi = (nir - red) / denominator
    return np.clip(ndvi, -1.0, 1.0)

def compute_ndwi(green_band: np.ndarray, nir_band: np.ndarray) -> np.ndarray:
    """
    Calculate Normalized Difference Water Index (McFeeters NDWI)
    NDWI = (GREEN - NIR) / (GREEN + NIR)
    Positive values (> 0.0) generally represent open water bodies.
    """
    green = green_band.astype(np.float32)
    nir = nir_band.astype(np.float32)
    denominator = green + nir
    denominator[denominator == 0] = 1e-6
    ndwi = (green - nir) / denominator
    return np.clip(ndwi, -1.0, 1.0)

def compute_mndwi(green_band: np.ndarray, swir_band: np.ndarray) -> np.ndarray:
    """Calculate Modified Normalized Difference Water Index (MNDWI = (GREEN - SWIR) / (GREEN + SWIR))."""
    green = green_band.astype(np.float32)
    swir = swir_band.astype(np.float32)
    denom = green + swir
    denom[denom == 0] = 1e-6
    return np.clip((green - swir) / denom, -1.0, 1.0)

def compute_nbr(nir_band: np.ndarray, swir_band: np.ndarray) -> np.ndarray:
    """Calculate Normalized Burn Ratio (NBR = (NIR - SWIR) / (NIR + SWIR))."""
    nir = nir_band.astype(np.float32)
    swir = swir_band.astype(np.float32)
    denom = nir + swir
    denom[denom == 0] = 1e-6
    return np.clip((nir - swir) / denom, -1.0, 1.0)

def summarize_ndvi(ndvi_array: np.ndarray) -> Dict[str, float]:
    """
    Compute statistical distribution of NDVI:
    - Healthy vegetation (NDVI > 0.45)
    - Stressed / Moderate vegetation (0.2 <= NDVI <= 0.45)
    - Bare land / Soil / Urban (0.0 <= NDVI < 0.2)
    - Water / Cloud shadow (NDVI < 0.0)
    """
    total_pixels = float(ndvi_array.size)
    if total_pixels == 0:
        return {"min": 0.0, "max": 0.0, "mean": 0.0, "healthy_pct": 0.0, "stressed_pct": 0.0, "bare_land_pct": 0.0}
    
    healthy_pixels = np.sum(ndvi_array > 0.45)
    stressed_pixels = np.sum((ndvi_array >= 0.20) & (ndvi_array <= 0.45))
    bare_pixels = np.sum((ndvi_array >= 0.0) & (ndvi_array < 0.20))
    
    return {
        "min": round(float(np.min(ndvi_array)), 4),
        "max": round(float(np.max(ndvi_array)), 4),
        "mean": round(float(np.mean(ndvi_array)), 4),
        "healthy_pct": round((healthy_pixels / total_pixels) * 100.0, 2),
        "stressed_pct": round((stressed_pixels / total_pixels) * 100.0, 2),
        "bare_land_pct": round((bare_pixels / total_pixels) * 100.0, 2)
    }

def summarize_ndwi(ndwi_array: np.ndarray, water_threshold: float = 0.05) -> Dict[str, float]:
    """
    Summarize water body extent and coverage from NDWI array.
    """
    total_pixels = float(ndwi_array.size)
    if total_pixels == 0:
        return {"min": 0.0, "max": 0.0, "mean": 0.0, "water_pct": 0.0}
    
    water_pixels = np.sum(ndwi_array >= water_threshold)
    return {
        "min": round(float(np.min(ndwi_array)), 4),
        "max": round(float(np.max(ndwi_array)), 4),
        "mean": round(float(np.mean(ndwi_array)), 4),
        "water_pct": round((water_pixels / total_pixels) * 100.0, 2)
    }
