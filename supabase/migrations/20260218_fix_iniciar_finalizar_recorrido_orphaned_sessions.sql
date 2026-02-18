-- Fix: finalizar_recorrido cerraba solo fecha=CURRENT_DATE (UTC).
-- Si el recorrido empezó antes de medianoche UTC, su fila tiene fecha=día anterior
-- y quedaba con activo=true aunque el chofer haya presionado "Finalizar".
-- Nuevo: cerrar TODAS las filas activas de esa asignacion.

CREATE OR REPLACE FUNCTION finalizar_recorrido(p_id_asignacion uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE estados_recorrido
  SET
    activo = false,
    hora_fin = NOW(),
    updated_at = NOW()
  WHERE id_asignacion = p_id_asignacion
    AND activo = true;

  RETURN FOUND;
END;
$$;

-- Fix: iniciar_recorrido no cerraba sesiones activas de días anteriores.
-- Si el chofer tenía una sesión sin finalizar, quedaba activo=true y el padre
-- la veía como ruta en curso aunque no lo estuviera.
-- Nuevo: cerrar sesiones activas anteriores antes de crear la nueva.

CREATE OR REPLACE FUNCTION iniciar_recorrido(p_id_asignacion uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_id_chofer UUID;
BEGIN
  SELECT id_chofer INTO v_id_chofer
  FROM asignaciones_ruta
  WHERE id = p_id_asignacion;

  IF v_id_chofer IS NULL THEN
    RAISE EXCEPTION 'Asignación no encontrada';
  END IF;

  -- Cerrar sesiones activas anteriores (de días previos) para evitar filas huérfanas
  UPDATE estados_recorrido
  SET activo = false, hora_fin = NOW(), updated_at = NOW()
  WHERE id_asignacion = p_id_asignacion
    AND activo = true
    AND fecha != CURRENT_DATE;

  -- Crear/actualizar la sesión de hoy
  INSERT INTO estados_recorrido (id_asignacion, id_chofer, fecha, activo, hora_inicio)
  VALUES (p_id_asignacion, v_id_chofer, CURRENT_DATE, true, NOW())
  ON CONFLICT (id_asignacion, fecha)
  DO UPDATE SET
    activo = true,
    hora_inicio = NOW(),
    hora_fin = NULL,
    updated_at = NOW();

  RETURN true;
END;
$$;
