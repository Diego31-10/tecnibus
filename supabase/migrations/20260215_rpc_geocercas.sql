-- =====================================================
-- Migración: RPCs para manejar eventos de geocercas
-- Fecha: 2026-02-15
-- Descripción: Funciones para entrada/salida de geocercas
--              Notificaciones se envían desde el frontend
-- =====================================================

-- ============================================
-- Función: Inicializar estados de geocercas al iniciar recorrido
-- Recibe id_asignacion (asignaciones_ruta.id) y resuelve estados_recorrido internamente
-- ============================================
CREATE OR REPLACE FUNCTION inicializar_estados_geocercas(
  p_id_asignacion UUID,
  p_id_chofer UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_id_recorrido UUID;
  v_id_ruta UUID;
BEGIN
  -- Obtener el estados_recorrido.id del día actual
  SELECT er.id INTO v_id_recorrido
  FROM estados_recorrido er
  WHERE er.id_asignacion = p_id_asignacion
    AND er.id_chofer = p_id_chofer
    AND er.fecha = CURRENT_DATE;

  IF v_id_recorrido IS NULL THEN
    RAISE EXCEPTION 'No se encontró recorrido activo para esta asignación';
  END IF;

  -- Obtener el id_ruta de la asignación
  SELECT ar.id_ruta INTO v_id_ruta
  FROM asignaciones_ruta ar
  WHERE ar.id = p_id_asignacion;

  IF v_id_ruta IS NULL THEN
    RAISE EXCEPTION 'No se encontró la asignación de ruta';
  END IF;

  -- Crear estados pendientes para todos los estudiantes de la ruta
  INSERT INTO estados_geocercas_recorrido (
    id_recorrido,
    id_estudiante,
    id_parada,
    estado
  )
  SELECT
    v_id_recorrido,
    e.id,
    e.id_parada,
    'pendiente'::estado_geocerca
  FROM estudiantes e
  INNER JOIN paradas p ON p.id = e.id_parada
  WHERE p.id_ruta = v_id_ruta
    AND e.id_parada IS NOT NULL
  ON CONFLICT (id_recorrido, id_estudiante) DO NOTHING;
END;
$$;

-- ============================================
-- Función: Marcar entrada a geocerca
-- Notificaciones push se envían desde el frontend con sendPushToParents()
-- ============================================
CREATE OR REPLACE FUNCTION entrada_geocerca(
  p_id_asignacion UUID,
  p_id_estudiante UUID,
  p_id_chofer UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_id_recorrido UUID;
  v_estudiante RECORD;
BEGIN
  -- Obtener el estados_recorrido.id del día actual
  SELECT er.id INTO v_id_recorrido
  FROM estados_recorrido er
  WHERE er.id_asignacion = p_id_asignacion
    AND er.id_chofer = p_id_chofer
    AND er.fecha = CURRENT_DATE;

  IF v_id_recorrido IS NULL THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;

  -- Actualizar estado a 'en_zona'
  UPDATE estados_geocercas_recorrido
  SET
    estado = 'en_zona'::estado_geocerca,
    entrada_geocerca_at = NOW(),
    updated_at = NOW()
  WHERE id_recorrido = v_id_recorrido
    AND id_estudiante = p_id_estudiante
    AND estado = 'pendiente'::estado_geocerca;

  -- Obtener info del estudiante
  SELECT
    e.id,
    e.nombre,
    e.apellido,
    e.id_padre,
    p.nombre as parada_nombre
  INTO v_estudiante
  FROM estudiantes e
  LEFT JOIN paradas p ON p.id = e.id_parada
  WHERE e.id = p_id_estudiante;

  -- Retornar info del estudiante
  RETURN jsonb_build_object(
    'id_estudiante', v_estudiante.id,
    'nombre', v_estudiante.nombre,
    'apellido', v_estudiante.apellido,
    'parada', v_estudiante.parada_nombre
  );
END;
$$;

-- ============================================
-- Función: Marcar salida de geocerca (auto-presente)
-- No sobreescribe ausencia marcada por padre
-- ============================================
CREATE OR REPLACE FUNCTION salida_geocerca(
  p_id_asignacion UUID,
  p_id_estudiante UUID,
  p_id_chofer UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_id_recorrido UUID;
  v_estado_actual estado_geocerca;
  v_asistencia_existente TEXT;
BEGIN
  -- Obtener el estados_recorrido.id del día actual
  SELECT er.id INTO v_id_recorrido
  FROM estados_recorrido er
  WHERE er.id_asignacion = p_id_asignacion
    AND er.id_chofer = p_id_chofer
    AND er.fecha = CURRENT_DATE;

  IF v_id_recorrido IS NULL THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;

  -- Obtener estado actual del geocerca
  SELECT estado INTO v_estado_actual
  FROM estados_geocercas_recorrido
  WHERE id_recorrido = v_id_recorrido
    AND id_estudiante = p_id_estudiante;

  -- Solo procesar si está 'en_zona'
  IF v_estado_actual = 'en_zona'::estado_geocerca THEN
    -- Verificar si el padre ya marcó ausencia (no sobreescribir)
    SELECT a.estado INTO v_asistencia_existente
    FROM asistencias a
    WHERE a.id_estudiante = p_id_estudiante
      AND a.fecha = CURRENT_DATE;

    -- Si ya hay una asistencia marcada como 'ausente', respetar la decisión del padre
    IF v_asistencia_existente = 'ausente' THEN
      -- Marcar geocerca como completado (no omitido), ya fue procesado
      UPDATE estados_geocercas_recorrido
      SET
        estado = 'completado'::estado_geocerca,
        salida_geocerca_at = NOW(),
        updated_at = NOW()
      WHERE id_recorrido = v_id_recorrido
        AND id_estudiante = p_id_estudiante;
    ELSE
      -- Marcar como omitido y presente automáticamente
      UPDATE estados_geocercas_recorrido
      SET
        estado = 'omitido'::estado_geocerca,
        salida_geocerca_at = NOW(),
        updated_at = NOW()
      WHERE id_recorrido = v_id_recorrido
        AND id_estudiante = p_id_estudiante;

      -- Marcar asistencia como 'presente' automáticamente
      INSERT INTO asistencias (
        id_estudiante,
        fecha,
        estado,
        notas
      ) VALUES (
        p_id_estudiante,
        CURRENT_DATE,
        'presente',
        'Marcado automáticamente al salir del geocerca'
      )
      ON CONFLICT (id_estudiante, fecha)
      DO UPDATE SET
        estado = 'presente',
        notas = 'Marcado automáticamente al salir del geocerca',
        updated_at = NOW()
      WHERE asistencias.estado != 'ausente'; -- Doble protección: no sobreescribir ausencia
    END IF;
  END IF;
END;
$$;

-- ============================================
-- Función: Marcar estudiante como completado (ausente manual)
-- ============================================
CREATE OR REPLACE FUNCTION marcar_estudiante_completado(
  p_id_asignacion UUID,
  p_id_estudiante UUID,
  p_id_chofer UUID,
  p_estado_asistencia TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_id_recorrido UUID;
BEGIN
  -- Obtener el estados_recorrido.id del día actual
  SELECT er.id INTO v_id_recorrido
  FROM estados_recorrido er
  WHERE er.id_asignacion = p_id_asignacion
    AND er.id_chofer = p_id_chofer
    AND er.fecha = CURRENT_DATE;

  IF v_id_recorrido IS NULL THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;

  -- Actualizar estado a 'completado'
  UPDATE estados_geocercas_recorrido
  SET
    estado = 'completado'::estado_geocerca,
    updated_at = NOW()
  WHERE id_recorrido = v_id_recorrido
    AND id_estudiante = p_id_estudiante;
END;
$$;

-- ============================================
-- Función: Obtener siguiente estudiante pendiente
-- ============================================
CREATE OR REPLACE FUNCTION get_siguiente_estudiante_geocerca(
  p_id_asignacion UUID
)
RETURNS TABLE (
  id_estudiante UUID,
  nombre TEXT,
  apellido TEXT,
  id_parada UUID,
  parada_nombre TEXT,
  parada_latitud DOUBLE PRECISION,
  parada_longitud DOUBLE PRECISION,
  orden_parada INTEGER,
  estado estado_geocerca
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_id_recorrido UUID;
BEGIN
  -- Obtener el estados_recorrido.id del día actual
  SELECT er.id INTO v_id_recorrido
  FROM estados_recorrido er
  WHERE er.id_asignacion = p_id_asignacion
    AND er.fecha = CURRENT_DATE;

  IF v_id_recorrido IS NULL THEN
    RETURN; -- No hay recorrido activo, retornar vacío
  END IF;

  RETURN QUERY
  SELECT
    e.id as id_estudiante,
    e.nombre,
    e.apellido,
    p.id as id_parada,
    p.nombre as parada_nombre,
    p.latitud::double precision as parada_latitud,
    p.longitud::double precision as parada_longitud,
    p.orden as orden_parada,
    eg.estado
  FROM estados_geocercas_recorrido eg
  INNER JOIN estudiantes e ON e.id = eg.id_estudiante
  INNER JOIN paradas p ON p.id = eg.id_parada
  WHERE eg.id_recorrido = v_id_recorrido
    AND eg.estado IN ('pendiente'::estado_geocerca, 'en_zona'::estado_geocerca)
  ORDER BY p.orden ASC, eg.estado DESC -- 'en_zona' primero, luego 'pendiente'
  LIMIT 1;
END;
$$;

-- Comentarios
COMMENT ON FUNCTION inicializar_estados_geocercas IS 'Crea estados pendientes para todos los estudiantes al iniciar recorrido';
COMMENT ON FUNCTION entrada_geocerca IS 'Marca entrada a geocerca y retorna info del estudiante';
COMMENT ON FUNCTION salida_geocerca IS 'Marca salida de geocerca y asistencia automática (respeta ausencia del padre)';
COMMENT ON FUNCTION marcar_estudiante_completado IS 'Marca estudiante como completado (ausente manual)';
COMMENT ON FUNCTION get_siguiente_estudiante_geocerca IS 'Obtiene el siguiente estudiante pendiente o en zona';
