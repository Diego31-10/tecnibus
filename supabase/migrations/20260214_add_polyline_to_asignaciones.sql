-- Agregar columna para guardar el polyline calculado
-- Esto permite que el padre vea la ruta sin tener que recalcularla
ALTER TABLE asignaciones_ruta
ADD COLUMN IF NOT EXISTS polyline_coordinates JSONB;

COMMENT ON COLUMN asignaciones_ruta.polyline_coordinates
IS 'Coordenadas del polyline calculado por Google Directions API, formato: [{latitude: number, longitude: number}]';
