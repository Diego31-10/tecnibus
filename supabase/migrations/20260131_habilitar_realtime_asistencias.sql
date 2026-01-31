-- =====================================================
-- Migración: Habilitar Realtime en asistencias
-- Fecha: 2026-01-31
-- Descripción: Permitir actualizaciones en tiempo real
-- =====================================================

-- Configurar replica identity para capturar todos los cambios
ALTER TABLE asistencias REPLICA IDENTITY FULL;

-- Publicar tabla en el canal de replicación de Supabase
ALTER PUBLICATION supabase_realtime ADD TABLE asistencias;

COMMENT ON TABLE asistencias IS 'Asistencias con actualización en tiempo real habilitada';
