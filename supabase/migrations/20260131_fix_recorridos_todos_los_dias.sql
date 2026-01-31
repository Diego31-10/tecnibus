-- =====================================================
-- Fix: Recorridos disponibles todos los días
-- Fecha: 2026-01-31
-- Descripción: Cambiar recorridos de prueba a NULL
--              para que funcionen todos los días
-- =====================================================

-- Actualizar recorridos existentes para que funcionen todos los días
UPDATE public.asignaciones_ruta
SET dias_semana = NULL
WHERE dias_semana IS NOT NULL;

-- Comentario explicativo
COMMENT ON COLUMN public.asignaciones_ruta.dias_semana IS 'Array de días activos (lunes, martes, etc). NULL = todos los días';
