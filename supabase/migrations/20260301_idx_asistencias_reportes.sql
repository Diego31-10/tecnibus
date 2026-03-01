-- =====================================================
-- Migración: Índices para optimización de reportes
-- Fecha: 2026-03-01
-- Descripción: Índices compuestos para queries de reportes de asistencia
-- =====================================================

-- Índice por estado (filtro frecuente en reportes)
CREATE INDEX IF NOT EXISTS idx_asistencias_estado
  ON asistencias (estado);

-- Índice compuesto fecha + estado (rango de fechas con filtro de estado)
CREATE INDEX IF NOT EXISTS idx_asistencias_fecha_estado
  ON asistencias (fecha, estado);

-- Índice compuesto fecha + ruta + estado (reporte por ruta específica)
CREATE INDEX IF NOT EXISTS idx_asistencias_fecha_ruta_estado
  ON asistencias (fecha, id_ruta, estado);
