-- Add heading column to ubicaciones_bus table
ALTER TABLE ubicaciones_bus
ADD COLUMN IF NOT EXISTS heading DOUBLE PRECISION;

COMMENT ON COLUMN ubicaciones_bus.heading IS 'Dirección de movimiento en grados (0-360), donde 0=Norte, 90=Este, 180=Sur, 270=Oeste';
