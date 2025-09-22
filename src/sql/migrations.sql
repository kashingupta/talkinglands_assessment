-- Enable PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;

-- Points table
CREATE TABLE IF NOT EXISTS points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  properties JSONB DEFAULT '{}'::jsonb,
  geom GEOMETRY(Point, 4326) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Polygons table
CREATE TABLE IF NOT EXISTS polygons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  properties JSONB DEFAULT '{}'::jsonb,
  geom GEOMETRY(Polygon, 4326) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- For multi geometries, create views (optional)
CREATE VIEW IF NOT EXISTS multipoints AS
SELECT id, name, properties, ST_Collect(geom) AS geom
FROM points
GROUP BY id, name, properties;

-- Spatial indexes
CREATE INDEX IF NOT EXISTS idx_points_geom ON points USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_polygons_geom ON polygons USING GIST (geom);

-- Updated_at triggers
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_points_updated ON points;
CREATE TRIGGER trg_points_updated
BEFORE UPDATE ON points
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_polygons_updated ON polygons;
CREATE TRIGGER trg_polygons_updated
BEFORE UPDATE ON polygons
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
