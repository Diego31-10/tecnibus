-- Update get_ultima_ubicacion_bus to include heading and SECURITY DEFINER
DROP FUNCTION IF EXISTS get_ultima_ubicacion_bus(uuid);

CREATE OR REPLACE FUNCTION get_ultima_ubicacion_bus(p_id_asignacion UUID)
RETURNS TABLE(
  latitud DOUBLE PRECISION,
  longitud DOUBLE PRECISION,
  velocidad DOUBLE PRECISION,
  precision_gps DOUBLE PRECISION,
  heading DOUBLE PRECISION,
  ubicacion_timestamp TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER  -- Bypasea RLS para que padres puedan ver ubicaciones
AS $$
BEGIN
  RETURN QUERY
  SELECT ub.latitud, ub.longitud, ub.velocidad, ub.precision_gps, ub.heading, ub.ubicacion_timestamp
  FROM ubicaciones_bus ub
  WHERE ub.id_asignacion = p_id_asignacion
  ORDER BY ub.ubicacion_timestamp DESC LIMIT 1;
END;
$$;
