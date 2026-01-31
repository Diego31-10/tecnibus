-- =====================================================
-- Migración: Limpiar columnas obsoletas de asistencias
-- Fecha: 2026-01-31
-- Descripción: Eliminar tipo, fecha_hora, id_asignacion obsoletos
-- =====================================================

-- Eliminar columnas del sistema antiguo que ya no usamos
ALTER TABLE asistencias
  DROP COLUMN IF EXISTS tipo,
  DROP COLUMN IF EXISTS fecha_hora,
  DROP COLUMN IF EXISTS id_asignacion;

-- Hacer que estado sea NOT NULL con default
ALTER TABLE asistencias
  ALTER COLUMN estado SET NOT NULL,
  ALTER COLUMN estado SET DEFAULT 'pendiente'::estado_asistencia;

-- Hacer que fecha sea NOT NULL con default
ALTER TABLE asistencias
  ALTER COLUMN fecha SET NOT NULL,
  ALTER COLUMN fecha SET DEFAULT CURRENT_DATE;

COMMENT ON TABLE asistencias IS 'Sistema de asistencias con estados (pendiente→recogiendo→abordo/ausente→dejando→dejado)';
