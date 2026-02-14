-- =====================================================
-- Migración: RPC para que padres obtengan polyline de asignaciones
-- Fecha: 2026-02-14
-- Descripción: Función RPC con SECURITY DEFINER para evitar recursión RLS
--              cuando los padres obtienen el polyline de las rutas de sus hijos
-- =====================================================

-- Función para que el padre obtenga el polyline de la asignación
CREATE OR REPLACE FUNCTION get_polyline_asignacion(p_id_asignacion UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_polyline JSONB;
  v_id_ruta UUID;
BEGIN
  -- Verificar que el usuario esté autenticado
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'No autenticado';
  END IF;

  -- Obtener el id_ruta de la asignación
  SELECT id_ruta INTO v_id_ruta
  FROM asignaciones_ruta
  WHERE id = p_id_asignacion;

  IF v_id_ruta IS NULL THEN
    RETURN NULL;
  END IF;

  -- Verificar que el padre tenga un hijo en esta ruta
  IF NOT EXISTS (
    SELECT 1
    FROM estudiantes e
    JOIN paradas p ON p.id = e.id_parada
    WHERE e.id_padre = auth.uid()
      AND p.id_ruta = v_id_ruta
  ) THEN
    RAISE EXCEPTION 'No autorizado para ver esta asignación';
  END IF;

  -- Obtener el polyline
  SELECT polyline_coordinates INTO v_polyline
  FROM asignaciones_ruta
  WHERE id = p_id_asignacion;

  RETURN v_polyline;
END;
$$;

COMMENT ON FUNCTION get_polyline_asignacion(UUID)
IS 'Obtiene el polyline de una asignación si el padre tiene un hijo en esa ruta. Usa SECURITY DEFINER para evitar recursión RLS';
