-- Crear función RPC para guardar ubicaciones usando SECURITY DEFINER
-- Esto bypasea RLS y permite al chofer guardar ubicaciones
CREATE OR REPLACE FUNCTION guardar_ubicacion_chofer(
  p_id_asignacion UUID,
  p_id_chofer UUID,
  p_latitud DOUBLE PRECISION,
  p_longitud DOUBLE PRECISION,
  p_velocidad DOUBLE PRECISION DEFAULT NULL,
  p_precision_gps DOUBLE PRECISION DEFAULT NULL,
  p_heading DOUBLE PRECISION DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER -- Ejecuta con permisos del owner (bypasea RLS)
AS $$
DECLARE
  v_ubicacion_id UUID;
BEGIN
  -- Verificar que el usuario autenticado sea el chofer
  IF auth.uid() != p_id_chofer THEN
    RAISE EXCEPTION 'No autorizado: solo el chofer puede guardar su propia ubicación';
  END IF;

  -- Verificar que el chofer existe
  IF NOT EXISTS (SELECT 1 FROM choferes WHERE id = p_id_chofer) THEN
    RAISE EXCEPTION 'Chofer no encontrado';
  END IF;

  -- Insertar la ubicación
  INSERT INTO ubicaciones_bus (
    id_asignacion,
    id_chofer,
    latitud,
    longitud,
    velocidad,
    precision_gps,
    heading
  ) VALUES (
    p_id_asignacion,
    p_id_chofer,
    p_latitud,
    p_longitud,
    p_velocidad,
    p_precision_gps,
    p_heading
  ) RETURNING id INTO v_ubicacion_id;

  RETURN v_ubicacion_id;
END;
$$;

-- Dar permisos de ejecución a usuarios autenticados
GRANT EXECUTE ON FUNCTION guardar_ubicacion_chofer TO authenticated;

COMMENT ON FUNCTION guardar_ubicacion_chofer IS 'Permite a los choferes guardar su ubicación GPS durante un recorrido, bypasiando RLS';
