-- =====================================================
-- Migración: Fixes múltiples
-- Fecha: 2026-01-31
-- Descripción:
--   1. Fix tipos de retorno en get_recorridos_chofer_hoy
--   2. Agregar constraint UNIQUE en choferes.id_buseta
--   3. Hacer opcionales los horarios en rutas
-- =====================================================

-- =====================================================
-- PASO 1: Recrear función con tipos correctos
-- =====================================================

DROP FUNCTION IF EXISTS get_recorridos_chofer_hoy(UUID);

CREATE OR REPLACE FUNCTION get_recorridos_chofer_hoy(p_id_chofer UUID)
RETURNS TABLE (
  id UUID,
  id_ruta UUID,
  nombre_ruta TEXT,  -- Cambiado de VARCHAR a TEXT
  hora_inicio TIME,
  hora_fin TIME,
  descripcion TEXT,  -- Cambiado de VARCHAR a TEXT
  estado_ruta TEXT   -- Cambiado de VARCHAR a TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_dia_semana TEXT;
BEGIN
  -- Obtener día de la semana en español
  v_dia_semana := LOWER(TO_CHAR(CURRENT_DATE, 'Day'));
  v_dia_semana := TRIM(v_dia_semana);

  RETURN QUERY
  SELECT
    ar.id,
    ar.id_ruta,
    r.nombre::TEXT,
    ar.hora_inicio,
    ar.hora_fin,
    ar.descripcion::TEXT,
    COALESCE(r.estado, 'activa')::TEXT
  FROM public.asignaciones_ruta ar
  JOIN public.rutas r ON ar.id_ruta = r.id
  WHERE ar.id_chofer = p_id_chofer
    AND ar.activo = true
    AND (
      ar.dias_semana IS NULL
      OR v_dia_semana = ANY(ar.dias_semana)
    )
  ORDER BY ar.hora_inicio ASC;
END;
$$;

COMMENT ON FUNCTION get_recorridos_chofer_hoy IS 'Obtiene los recorridos asignados a un chofer para el día actual';

-- =====================================================
-- PASO 2: Agregar constraint UNIQUE en choferes.id_buseta
-- =====================================================

-- Primero, verificar si hay duplicados y resolverlos
DO $$
DECLARE
  v_buseta_duplicada UUID;
  v_choferes_count INTEGER;
BEGIN
  FOR v_buseta_duplicada IN
    SELECT id_buseta
    FROM choferes
    WHERE id_buseta IS NOT NULL
    GROUP BY id_buseta
    HAVING COUNT(*) > 1
  LOOP
    -- Contar cuántos choferes tienen esta buseta
    SELECT COUNT(*) INTO v_choferes_count
    FROM choferes
    WHERE id_buseta = v_buseta_duplicada;

    -- Mantener solo el primer chofer con esta buseta, el resto NULL
    UPDATE choferes
    SET id_buseta = NULL
    WHERE id_buseta = v_buseta_duplicada
      AND id NOT IN (
        SELECT id FROM choferes WHERE id_buseta = v_buseta_duplicada LIMIT 1
      );

    RAISE NOTICE 'Buseta % estaba duplicada en % choferes. Duplicados removidos.', v_buseta_duplicada, v_choferes_count;
  END LOOP;
END $$;

-- Ahora agregar constraint UNIQUE
ALTER TABLE public.choferes
ADD CONSTRAINT choferes_id_buseta_unique UNIQUE (id_buseta);

COMMENT ON CONSTRAINT choferes_id_buseta_unique ON public.choferes IS 'Una buseta solo puede estar asignada a un chofer a la vez';

-- =====================================================
-- PASO 3: Hacer opcionales los horarios en rutas
-- =====================================================

-- Los horarios ahora se manejan en asignaciones_ruta
-- Dejamos los campos en rutas como NULL por compatibilidad
-- pero ya no son necesarios

UPDATE public.rutas
SET hora_inicio = NULL, hora_fin = NULL
WHERE hora_inicio IS NOT NULL OR hora_fin IS NOT NULL;

COMMENT ON COLUMN public.rutas.hora_inicio IS 'DEPRECADO: Usar asignaciones_ruta para horarios específicos';
COMMENT ON COLUMN public.rutas.hora_fin IS 'DEPRECADO: Usar asignaciones_ruta para horarios específicos';

-- =====================================================
-- FIN DE MIGRACIÓN
-- =====================================================
