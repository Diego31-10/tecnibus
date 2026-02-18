-- Fix: get_estado_recorrido_por_ruta fallaba cuando el recorrido empezó
-- en el día anterior (antes de medianoche UTC). El JOIN usaba er.fecha = CURRENT_DATE
-- pero el chofer inicia en Ecuador (UTC-5) donde aún es el día anterior en UTC.
--
-- Solución: usar LATERAL JOIN con ventana de 36h y priorizar filas activas.

CREATE OR REPLACE FUNCTION get_estado_recorrido_por_ruta(p_id_ruta uuid)
RETURNS TABLE(
  activo boolean,
  hora_inicio timestamptz,
  hora_fin timestamptz,
  id_asignacion uuid
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
    ar.id AS id_asignacion
  FROM asignaciones_ruta ar
  LEFT JOIN LATERAL (
    -- Buscar el recorrido más reciente en ventana de 36h,
    -- priorizando filas activas (activo DESC) y luego las más recientes.
    -- Alias er2 para evitar ambigüedad con la columna del RETURNS TABLE.
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

-- Limpiar sesiones activas viejas (> 24h) que quedaron sin finalizar
UPDATE public.estados_recorrido
SET activo = false
WHERE activo = true
  AND hora_inicio < NOW() - INTERVAL '24 hours';
