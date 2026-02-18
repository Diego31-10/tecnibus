-- Agregar eta_paradas al retorno del RPC para que el padre no necesite
-- hacer una segunda query directa a estados_recorrido.
-- La función es SECURITY DEFINER: bypasea RLS y siempre devuelve datos correctos.

DROP FUNCTION IF EXISTS get_estado_recorrido_por_ruta(uuid);

CREATE FUNCTION get_estado_recorrido_por_ruta(p_id_ruta uuid)
RETURNS TABLE(
  activo boolean,
  hora_inicio timestamptz,
  hora_fin timestamptz,
  id_asignacion uuid,
  eta_paradas jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(er.activo, false) AS activo,
    er.hora_inicio,
    er.hora_fin,
    ar.id AS id_asignacion,
    er.eta_paradas
  FROM asignaciones_ruta ar
  LEFT JOIN LATERAL (
    SELECT *
    FROM estados_recorrido er2
    WHERE er2.id_asignacion = ar.id
      AND er2.hora_inicio >= NOW() - INTERVAL '36 hours'
    ORDER BY er2.activo DESC, er2.hora_inicio DESC
    LIMIT 1
  ) er ON true
  WHERE ar.id_ruta = p_id_ruta
    AND ar.activo = true
  LIMIT 1;
END;
$$;
