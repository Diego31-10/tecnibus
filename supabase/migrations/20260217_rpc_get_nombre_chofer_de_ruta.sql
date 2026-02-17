-- =====================================================
-- Función RPC: Obtener nombre del chofer de una ruta
-- Para uso de padres (bypassing RLS via SECURITY DEFINER)
-- =====================================================

CREATE OR REPLACE FUNCTION get_nombre_chofer_de_ruta(p_id_ruta UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_nombre TEXT;
BEGIN
  -- Verificar que el usuario esté autenticado
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'No autenticado';
  END IF;

  -- Obtener nombre completo del chofer activo de la ruta
  SELECT p.nombre || ' ' || p.apellido
  INTO v_nombre
  FROM public.asignaciones_ruta ar
  JOIN public.choferes c ON c.id = ar.id_chofer
  JOIN public.profiles p ON p.id = c.id
  WHERE ar.id_ruta = p_id_ruta
    AND ar.activo = true
  LIMIT 1;

  RETURN v_nombre;
END;
$$;

COMMENT ON FUNCTION get_nombre_chofer_de_ruta(UUID)
IS 'Obtiene el nombre completo del chofer activo de una ruta. SECURITY DEFINER para padres.';
