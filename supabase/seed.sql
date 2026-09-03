-- =========================================================
-- SATQUERY AI — POSTGIS SEED DATA
-- Pre-indexed regions and tile metadata
-- =========================================================

-- Insert sample satellite tiles for development regions
INSERT INTO public.satellite_tiles (
    tile_code, title, region_name, description, capture_date,
    satellite_name, sensor_name, resolution_meters,
    bbox, center_lat, center_lon,
    footprint, cloud_cover_percentage, metadata_json
) VALUES
(
    'TILE-CHN-PORT-01',
    'Chennai Harbor & Port Maritime Tile',
    'Chennai Port',
    'High-resolution multi-spectral capture over Chennai Port shipping terminals and container berths.',
    '2025-06-15',
    'Sentinel-2',
    'MSI',
    10.0,
    '[80.2700, 13.0700, 80.3400, 13.1400]'::JSONB,
    13.1050,
    80.3050,
    ST_GeomFromText('POLYGON((80.2700 13.0700, 80.3400 13.0700, 80.3400 13.1400, 80.2700 13.1400, 80.2700 13.0700))', 4326),
    1.2,
    '{"processing_level": "Level-2A", "sun_elevation": 64.5, "orbit_direction": "DESCENDING"}'::JSONB
),
(
    'TILE-ASM-BRAHMA-02',
    'Assam Brahmaputra Basin Inundation Zone',
    'Assam Flood Region',
    'C-band Synthetic Aperture Radar (SAR) acquisition showing monsoon floodwaters across the Brahmaputra floodplain.',
    '2025-07-22',
    'Sentinel-1 SAR',
    'C-SAR',
    10.0,
    '[91.7000, 26.1500, 91.8800, 26.2800]'::JSONB,
    26.2150,
    91.7900,
    ST_GeomFromText('POLYGON((91.7000 26.1500, 91.8800 26.1500, 91.8800 26.2800, 91.7000 26.2800, 91.7000 26.1500))', 4326),
    0.0,
    '{"polarization": "VV+VH", "pass": "ASCENDING", "radar_frequency_ghz": 5.405}'::JSONB
),
(
    'TILE-BLR-URBAN-03',
    'Bengaluru Outer Ring Road & Tech Corridor',
    'Bengaluru Urban Region',
    'Multi-temporal optical coverage for urban expansion and impervious surface classification in Bengaluru East.',
    '2025-03-10',
    'Sentinel-2',
    'MSI',
    10.0,
    '[77.6200, 12.9000, 77.7200, 13.0000]'::JSONB,
    12.9500,
    77.6700,
    ST_GeomFromText('POLYGON((77.6200 12.9000, 77.7200 12.9000, 77.7200 13.0000, 77.6200 13.0000, 77.6200 12.9000))', 4326),
    3.8,
    '{"processing_level": "Level-2A", "mean_ndvi": 0.38, "built_up_ratio": 0.62}'::JSONB
),
(
    'TILE-MUM-COAST-04',
    'Mumbai Harbor & Jawaharlal Nehru Port Trust (JNPT)',
    'Mumbai Coastal Region',
    'Maritime infrastructure and coastal vessel tracking tile over Mumbai Bay.',
    '2025-05-18',
    'Sentinel-2',
    'MSI',
    10.0,
    '[72.8200, 18.9000, 72.9600, 19.0200]'::JSONB,
    18.9600,
    72.8900,
    ST_GeomFromText('POLYGON((72.8200 18.9000, 72.9600 18.9000, 72.9600 19.0200, 72.8200 19.0200, 72.8200 18.9000))', 4326),
    2.1,
    '{"processing_level": "Level-2A", "vessel_density_index": "HIGH"}'::JSONB
),
(
    'TILE-SUN-MANG-05',
    'Sundarbans Biosphere Reserve Delta',
    'Sundarbans',
    'Spectral index baseline for mangrove canopy health (NDVI) and estuarine tidal channels (NDWI).',
    '2025-04-12',
    'Sentinel-2',
    'MSI',
    10.0,
    '[88.7500, 21.8000, 89.0500, 22.0500]'::JSONB,
    21.9250,
    88.9000,
    ST_GeomFromText('POLYGON((88.7500 21.8000, 89.0500 21.8000, 89.0500 22.0500, 88.7500 22.0500, 88.7500 21.8000))', 4326),
    0.8,
    '{"processing_level": "Level-2A", "mean_ndvi": 0.74, "water_fraction": 0.45}'::JSONB
)
ON CONFLICT (tile_code) DO NOTHING;
