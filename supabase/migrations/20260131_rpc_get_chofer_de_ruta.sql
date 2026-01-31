-- =====================================================
-- Migración: Función RPC para obtener chofer de ruta
-- Fecha: 2026-01-31
-- Descripción: Permite a padres obtener el chofer asignado a una ruta
-- =====================================================

CREATE OR REPLACE FUNCTION get_chofer_de_ruta(p_id_ruta UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_id_chofer UUID;
BEGIN
  -- Obtener el primer chofer activo asignado a la ruta
  SELECT id_chofer
  INTO v_id_chofer
  FROM public.asignaciones_ruta
  WHERE id_ruta = p_id_ruta
    AND activo = true
  LIMIT 1;

  RETURN v_id_chofer;
END;
$$;

COMMENT ON FUNCTION get_chofer_de_ruta IS 'Obtiene el ID del chofer asignado a una ruta (bypassing RLS para uso en asistencias)';
