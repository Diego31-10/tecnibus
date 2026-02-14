-- Fix get_recorridos_chofer_hoy function to cast descripcion to text
DROP FUNCTION IF EXISTS get_recorridos_chofer_hoy(uuid);

CREATE OR REPLACE FUNCTION get_recorridos_chofer_hoy(p_id_chofer UUID)
RETURNS TABLE(
  id UUID,
  id_ruta UUID,
  nombre_ruta TEXT,
  tipo_ruta TEXT,
  hora_inicio TIME,
  hora_fin TIME,
  descripcion TEXT,
  estado_ruta TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
  dia_actual TEXT;
BEGIN
  -- Obtener día actual en español (minúsculas)
  dia_actual := CASE EXTRACT(DOW FROM CURRENT_DATE)
    WHEN 0 THEN 'domingo'
    WHEN 1 THEN 'lunes'
    WHEN 2 THEN 'martes'
    WHEN 3 THEN 'miércoles'
    WHEN 4 THEN 'jueves'
    WHEN 5 THEN 'viernes'
    WHEN 6 THEN 'sábado'
  END;

  RETURN QUERY
  SELECT
    a.id,
    a.id_ruta,
    r.nombre AS nombre_ruta,
    r.tipo AS tipo_ruta,
    a.hora_inicio,
    a.hora_fin,
    a.descripcion::text,  -- Cast to text
    r.estado AS estado_ruta
  FROM asignaciones_ruta a
  JOIN rutas r ON r.id = a.id_ruta
  WHERE
    a.id_chofer = p_id_chofer
    AND a.activo = true
    AND (
      a.dias_semana IS NULL
      OR dia_actual = ANY(a.dias_semana)
    );
END;
$$;
