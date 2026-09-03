-- =========================================================
-- SATQUERY AI — SUPABASE & POSTGIS DATABASE SCHEMA
-- Agentic Remote Sensing & Geospatial Intelligence Platform
-- =========================================================

-- 1. Enable PostGIS Extension
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Profiles Table (User Role & Persona Management)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL DEFAULT 'Geospatial Analyst',
    avatar_url TEXT,
    role TEXT NOT NULL DEFAULT 'USER' CHECK (role IN ('ADMIN', 'OFFICER', 'ANALYST', 'RESEARCHER', 'USER')),
    persona TEXT NOT NULL DEFAULT 'PUBLIC_RESEARCHER' CHECK (persona IN ('ISRO_ANALYST', 'NDRF_OFFICER', 'PUBLIC_RESEARCHER')),
    organization TEXT DEFAULT 'General Geospatial Operations',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Satellite Tiles Table (Pre-indexed & Real Satellite Imagery Footprints)
CREATE TABLE IF NOT EXISTS public.satellite_tiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tile_code TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    region_name TEXT NOT NULL,
    description TEXT,
    capture_date DATE NOT NULL,
    satellite_name TEXT NOT NULL, -- Sentinel-2, Sentinel-1 SAR, Landsat-9, Cartosat-3
    sensor_name TEXT NOT NULL,    -- MSI, C-SAR, OLI-2, PAN/MX
    resolution_meters NUMERIC(6, 2) NOT NULL DEFAULT 10.0,
    bbox JSONB NOT NULL,          -- [min_lon, min_lat, max_lon, max_lat]
    center_lat NUMERIC(9, 6) NOT NULL,
    center_lon NUMERIC(9, 6) NOT NULL,
    footprint GEOMETRY(Polygon, 4326),
    tile_url TEXT,
    thumbnail_url TEXT,
    cloud_cover_percentage NUMERIC(5, 2) DEFAULT 0.0,
    metadata_json JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Query Logs Table (Natural Language Queries & Telemetry)
CREATE TABLE IF NOT EXISTS public.query_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_persona TEXT NOT NULL,
    user_prompt TEXT NOT NULL,
    intent_type TEXT NOT NULL,
    data_source TEXT NOT NULL,
    execution_time_ms INTEGER NOT NULL,
    tile_id UUID REFERENCES public.satellite_tiles(id) ON DELETE SET NULL,
    summary_text TEXT NOT NULL,
    count_metric INTEGER,
    status TEXT NOT NULL DEFAULT 'SUCCESS',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Detections Table (Object Detection & Bounding Geometries)
CREATE TABLE IF NOT EXISTS public.detections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    query_log_id UUID REFERENCES public.query_logs(id) ON DELETE CASCADE,
    tile_id UUID REFERENCES public.satellite_tiles(id) ON DELETE SET NULL,
    label TEXT NOT NULL,
    confidence NUMERIC(5, 4) NOT NULL,
    geom GEOMETRY(Geometry, 4326) NOT NULL,
    metadata_json JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Analysis Results Table (NDVI, NDWI, Segmentation, Flood Extents)
CREATE TABLE IF NOT EXISTS public.analysis_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    query_log_id UUID REFERENCES public.query_logs(id) ON DELETE CASCADE,
    analysis_type TEXT NOT NULL,
    metric_name TEXT NOT NULL,
    metric_value NUMERIC(12, 4) NOT NULL,
    unit TEXT NOT NULL,
    geojson_data JSONB NOT NULL,
    metadata_json JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Change Detections Table (Temporal Differencing & Urban Growth)
CREATE TABLE IF NOT EXISTS public.change_detections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    query_log_id UUID REFERENCES public.query_logs(id) ON DELETE CASCADE,
    before_tile_id UUID REFERENCES public.satellite_tiles(id) ON DELETE SET NULL,
    after_tile_id UUID REFERENCES public.satellite_tiles(id) ON DELETE SET NULL,
    change_type TEXT NOT NULL, -- New Construction, Vegetation Loss, Vegetation Gain, Water Expansion, Flooding, Surface Change
    change_percentage NUMERIC(5, 2) NOT NULL,
    confidence NUMERIC(5, 4) NOT NULL,
    geom GEOMETRY(Geometry, 4326) NOT NULL,
    metadata_json JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Audit Trail Table (Immutable System Telemetry & Role Activity)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_persona TEXT NOT NULL,
    action TEXT NOT NULL,
    data_source TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'SUCCESS',
    user_prompt TEXT NOT NULL,
    execution_time_ms INTEGER DEFAULT 0,
    details_json JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Vessel Positions Table (Real-Time AIS Tracking & PostGIS Spatial Telemetry)
CREATE TABLE IF NOT EXISTS public.vessel_positions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mmsi TEXT NOT NULL,
    imo TEXT,
    vessel_name TEXT NOT NULL,
    callsign TEXT,
    latitude NUMERIC(9, 6) NOT NULL,
    longitude NUMERIC(9, 6) NOT NULL,
    speed_knots NUMERIC(5, 2) DEFAULT 0.0,
    course NUMERIC(5, 2) DEFAULT 0.0,
    heading NUMERIC(5, 2) DEFAULT 0.0,
    navigation_status TEXT DEFAULT 'Under Way',
    ship_type TEXT DEFAULT 'Cargo',
    destination TEXT,
    timestamp TIMESTAMPTZ NOT NULL,
    source TEXT DEFAULT 'AISStream',
    location GEOMETRY(Point, 4326),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================
-- SPATIAL & INDEX OPTIMIZATION
-- =========================================================
CREATE INDEX IF NOT EXISTS idx_satellite_tiles_footprint ON public.satellite_tiles USING GIST (footprint);
CREATE INDEX IF NOT EXISTS idx_satellite_tiles_region ON public.satellite_tiles (region_name);
CREATE INDEX IF NOT EXISTS idx_satellite_tiles_capture_date ON public.satellite_tiles (capture_date);

CREATE INDEX IF NOT EXISTS idx_detections_geom ON public.detections USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_detections_query_log_id ON public.detections (query_log_id);
CREATE INDEX IF NOT EXISTS idx_detections_label ON public.detections (label);

CREATE INDEX IF NOT EXISTS idx_change_detections_geom ON public.change_detections USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_change_detections_query_log_id ON public.change_detections (query_log_id);

CREATE INDEX IF NOT EXISTS idx_query_logs_user_id ON public.query_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_query_logs_intent_type ON public.query_logs (intent_type);
CREATE INDEX IF NOT EXISTS idx_query_logs_created_at ON public.query_logs (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_persona ON public.audit_logs (user_persona);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs (created_at DESC);

-- =========================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.satellite_tiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.query_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.detections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.change_detections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 1. Profiles: Users can view their own profile or public analyst profiles; can update only own
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- 2. Satellite Tiles: Public read-only for metadata
CREATE POLICY "Public read for satellite tiles metadata" ON public.satellite_tiles
    FOR SELECT USING (true);

-- 3. Query Logs: Users access their own query history
CREATE POLICY "Users can view their own query logs" ON public.query_logs
    FOR SELECT USING (auth.uid() = user_id OR auth.uid() IS NULL);

CREATE POLICY "Users can insert query logs" ON public.query_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.uid() IS NULL);

-- 4. Detections, Analysis Results, Change Detections: Accessible via query logs linkage
CREATE POLICY "Users view own detections" ON public.detections
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.query_logs
            WHERE public.query_logs.id = detections.query_log_id
            AND (public.query_logs.user_id = auth.uid() OR public.query_logs.user_id IS NULL)
        )
    );

CREATE POLICY "Users view own analysis results" ON public.analysis_results
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.query_logs
            WHERE public.query_logs.id = analysis_results.query_log_id
            AND (public.query_logs.user_id = auth.uid() OR public.query_logs.user_id IS NULL)
        )
    );

CREATE POLICY "Users view own change detections" ON public.change_detections
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.query_logs
            WHERE public.query_logs.id = change_detections.query_log_id
            AND (public.query_logs.user_id = auth.uid() OR public.query_logs.user_id IS NULL)
        )
    );

-- 5. Audit Logs: Read-only access to user's audit trail, insert by authenticated system
CREATE POLICY "Users view own audit events" ON public.audit_logs
    FOR SELECT USING (auth.uid() = user_id OR auth.uid() IS NULL);

CREATE POLICY "System can record audit logs" ON public.audit_logs
    FOR INSERT WITH CHECK (true);
