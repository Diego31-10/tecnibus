-- =====================================================
-- Migración: RPCs para manejar eventos de geocercas
-- Fecha: 2026-02-15
-- Descripción: Funciones para entrada/salida de geocercas
--              y notificaciones automáticas
-- =====================================================

-- ============================================
-- Función: Inicializar estados de geocercas al iniciar recorrido
-- ============================================
CREATE OR REPLACE FUNCTION inicializar_estados_geocercas(
  p_id_recorrido UUID,
  p_id_chofer UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar que el chofer es el dueño del recorrido
  IF NOT EXISTS (
    SELECT 1 FROM estados_recorrido
    WHERE id = p_id_recorrido AND id_chofer = p_id_chofer
  ) THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;

  -- Crear estados pendientes para todos los estudiantes del recorrido
  INSERT INTO estados_geocercas_recorrido (
    id_recorrido,
    id_estudiante,
    id_parada,
    estado
  )
  SELECT
    p_id_recorrido,
    e.id,
    e.id_parada,
    'pendiente'::estado_geocerca
  FROM estudiantes e
  INNER JOIN paradas p ON p.id = e.id_parada
  INNER JOIN estados_recorrido er ON er.id_ruta = p.id_ruta
  WHERE er.id = p_id_recorrido
    AND e.id_parada IS NOT NULL
  ON CONFLICT (id_recorrido, id_estudiante) DO NOTHING;
END;
$$;

-- ============================================
-- Función: Marcar entrada a geocerca
-- ============================================
CREATE OR REPLACE FUNCTION entrada_geocerca(
  p_id_recorrido UUID,
  p_id_estudiante UUID,
  p_id_chofer UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_estudiante RECORD;
  v_padre_id UUID;
  v_expo_token TEXT;
BEGIN
  -- Verificar que el chofer es el dueño del recorrido
  IF NOT EXISTS (
    SELECT 1 FROM estados_recorrido
    WHERE id = p_id_recorrido AND id_chofer = p_id_chofer
  ) THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;

  -- Actualizar estado a 'en_zona'
  UPDATE estados_geocercas_recorrido
  SET
    estado = 'en_zona'::estado_geocerca,
    entrada_geocerca_at = NOW(),
    updated_at = NOW()
  WHERE id_recorrido = p_id_recorrido
    AND id_estudiante = p_id_estudiante
    AND estado = 'pendiente'::estado_geocerca;

  -- Obtener info del estudiante y padre
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

  -- Enviar notificación push al padre
  IF v_estudiante.id_padre IS NOT NULL THEN
    -- Obtener token del padre (asumiendo que tienes una tabla push_tokens)
    SELECT expo_push_token INTO v_expo_token
    FROM push_tokens
    WHERE user_id = v_estudiante.id_padre
    LIMIT 1;

    IF v_expo_token IS NOT NULL THEN
      -- Insertar en cola de notificaciones
      INSERT INTO notification_queue (
        user_id,
        title,
        body,
        data,
        expo_push_token
      ) VALUES (
        v_estudiante.id_padre,
        'La buseta está cerca 🚌',
        format('La buseta llegará a %s en breve. %s %s será recogido pronto.',
          v_estudiante.parada_nombre,
          v_estudiante.nombre,
          v_estudiante.apellido
        ),
        jsonb_build_object(
          'tipo', 'geocerca_entrada',
          'id_estudiante', p_id_estudiante,
          'id_recorrido', p_id_recorrido
        ),
        v_expo_token
      );
    END IF;
  END IF;

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
-- ============================================
CREATE OR REPLACE FUNCTION salida_geocerca(
  p_id_recorrido UUID,
  p_id_estudiante UUID,
  p_id_chofer UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_estado_actual estado_geocerca;
BEGIN
  -- Verificar que el chofer es el dueño del recorrido
  IF NOT EXISTS (
    SELECT 1 FROM estados_recorrido
    WHERE id = p_id_recorrido AND id_chofer = p_id_chofer
  ) THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;

  -- Obtener estado actual
  SELECT estado INTO v_estado_actual
  FROM estados_geocercas_recorrido
  WHERE id_recorrido = p_id_recorrido
    AND id_estudiante = p_id_estudiante;

  -- Solo procesar si está 'en_zona'
  IF v_estado_actual = 'en_zona'::estado_geocerca THEN
    -- Actualizar estado a 'omitido' (se marcará presente automático)
    UPDATE estados_geocercas_recorrido
    SET
      estado = 'omitido'::estado_geocerca,
      salida_geocerca_at = NOW(),
      updated_at = NOW()
    WHERE id_recorrido = p_id_recorrido
      AND id_estudiante = p_id_estudiante;

    -- Marcar asistencia como 'presente' automáticamente
    -- (llamar a la función existente de asistencias)
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
      updated_at = NOW();
  END IF;
END;
$$;

-- ============================================
-- Función: Marcar estudiante como completado (ausente manual)
-- ============================================
CREATE OR REPLACE FUNCTION marcar_estudiante_completado(
  p_id_recorrido UUID,
  p_id_estudiante UUID,
  p_id_chofer UUID,
  p_estado_asistencia TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar que el chofer es el dueño del recorrido
  IF NOT EXISTS (
    SELECT 1 FROM estados_recorrido
    WHERE id = p_id_recorrido AND id_chofer = p_id_chofer
  ) THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;

  -- Actualizar estado a 'completado'
  UPDATE estados_geocercas_recorrido
  SET
    estado = 'completado'::estado_geocerca,
    updated_at = NOW()
  WHERE id_recorrido = p_id_recorrido
    AND id_estudiante = p_id_estudiante;

  -- La asistencia ya se marca en el frontend, esto solo actualiza el estado del geocerca
END;
$$;

-- ============================================
-- Función: Obtener siguiente estudiante pendiente
-- ============================================
CREATE OR REPLACE FUNCTION get_siguiente_estudiante_geocerca(
  p_id_recorrido UUID
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
BEGIN
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
  WHERE eg.id_recorrido = p_id_recorrido
    AND eg.estado IN ('pendiente'::estado_geocerca, 'en_zona'::estado_geocerca)
  ORDER BY p.orden ASC, eg.estado DESC -- 'en_zona' primero, luego 'pendiente'
  LIMIT 1;
END;
$$;

-- Comentarios
COMMENT ON FUNCTION inicializar_estados_geocercas IS 'Crea estados pendientes para todos los estudiantes al iniciar recorrido';
COMMENT ON FUNCTION entrada_geocerca IS 'Marca entrada a geocerca y envía notificación al padre';
COMMENT ON FUNCTION salida_geocerca IS 'Marca salida de geocerca y asistencia automática como presente';
COMMENT ON FUNCTION marcar_estudiante_completado IS 'Marca estudiante como completado (ausente manual)';
COMMENT ON FUNCTION get_siguiente_estudiante_geocerca IS 'Obtiene el siguiente estudiante pendiente o en zona';
