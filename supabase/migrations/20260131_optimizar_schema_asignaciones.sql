-- =====================================================
-- Migración: Optimización de schema de asignaciones
-- Fecha: 2026-01-31
-- Descripción:
--   1. Crear tabla asignaciones_ruta (recorridos flexibles)
--   2. Modificar estudiantes: id_ruta → id_parada
--   3. Modificar asistencias: agregar id_asignacion
--   4. Eliminar tablas obsoletas
-- =====================================================

-- =====================================================
-- PASO 1: Crear nueva tabla asignaciones_ruta
-- =====================================================

CREATE TABLE IF NOT EXISTS public.asignaciones_ruta (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_chofer UUID NOT NULL REFERENCES public.choferes(id) ON DELETE CASCADE,
  id_ruta UUID NOT NULL REFERENCES public.rutas(id) ON DELETE CASCADE,

  -- Horario específico del recorrido
  hora_inicio TIME NOT NULL,
  hora_fin TIME NOT NULL,

  -- Descripción del recorrido
  descripcion VARCHAR(100) NULL,

  -- Días de la semana activos (NULL = todos los días)
  dias_semana TEXT[] NULL,

  -- Estado
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Validación: hora_fin debe ser mayor que hora_inicio
  CONSTRAINT valid_horario CHECK (hora_fin > hora_inicio)
);

-- Índices para asignaciones_ruta
CREATE INDEX idx_asignaciones_ruta_chofer ON public.asignaciones_ruta(id_chofer);
CREATE INDEX idx_asignaciones_ruta_ruta ON public.asignaciones_ruta(id_ruta);
CREATE INDEX idx_asignaciones_ruta_activo ON public.asignaciones_ruta(activo) WHERE activo = true;

-- Comentarios
COMMENT ON TABLE public.asignaciones_ruta IS 'Asignaciones permanentes de recorridos para choferes (horarios flexibles)';
COMMENT ON COLUMN public.asignaciones_ruta.hora_inicio IS 'Hora de inicio del recorrido (ej: 06:00:00)';
COMMENT ON COLUMN public.asignaciones_ruta.hora_fin IS 'Hora de finalización del recorrido (ej: 07:00:00)';
COMMENT ON COLUMN public.asignaciones_ruta.dias_semana IS 'Array de días activos: {lunes,martes,...} o NULL para todos';
COMMENT ON COLUMN public.asignaciones_ruta.descripcion IS 'Descripción del recorrido: "Llevar estudiantes", "Recoger estudiantes", etc.';

-- =====================================================
-- PASO 2: Modificar tabla estudiantes
-- Cambiar id_ruta por id_parada (ubicación fija)
-- =====================================================

-- Primero, eliminar políticas RLS que dependen de estudiantes.id_ruta
DROP POLICY IF EXISTS "Parents can view routes of their students" ON public.rutas;

-- Agregar la nueva columna
ALTER TABLE public.estudiantes
ADD COLUMN IF NOT EXISTS id_parada UUID REFERENCES public.paradas(id) ON DELETE SET NULL;

-- Migrar datos existentes: asignar a primera parada de la ruta
-- (solo si hay datos, esto es para no perder información)
UPDATE public.estudiantes e
SET id_parada = (
  SELECT p.id
  FROM public.paradas p
  WHERE p.id_ruta = e.id_ruta
  ORDER BY p.orden ASC
  LIMIT 1
)
WHERE e.id_ruta IS NOT NULL AND e.id_parada IS NULL;

-- Ahora eliminar la columna antigua usando CASCADE
ALTER TABLE public.estudiantes
DROP COLUMN IF EXISTS id_ruta CASCADE;

-- Crear índice
CREATE INDEX idx_estudiantes_parada ON public.estudiantes(id_parada);

COMMENT ON COLUMN public.estudiantes.id_parada IS 'Parada fija asignada al estudiante (ubicación permanente)';

-- =====================================================
-- PASO 3: Modificar tabla asistencias
-- Agregar id_asignacion para contexto del recorrido
-- =====================================================

ALTER TABLE public.asistencias
ADD COLUMN IF NOT EXISTS id_asignacion UUID REFERENCES public.asignaciones_ruta(id) ON DELETE SET NULL;

-- Crear índice
CREATE INDEX idx_asistencias_asignacion ON public.asistencias(id_asignacion);

COMMENT ON COLUMN public.asistencias.id_asignacion IS 'Referencia al recorrido específico donde se registró la asistencia';

-- =====================================================
-- PASO 4: Eliminar tablas obsoletas
-- =====================================================

-- Eliminar asignaciones_chofer (reemplazada por asignaciones_ruta)
DROP TABLE IF EXISTS public.asignaciones_chofer CASCADE;

-- Eliminar rutas_buseta (relación indirecta via asignaciones_ruta)
DROP TABLE IF EXISTS public.rutas_buseta CASCADE;

-- =====================================================
-- PASO 5: RLS Policies para asignaciones_ruta
-- =====================================================

ALTER TABLE public.asignaciones_ruta ENABLE ROW LEVEL SECURITY;

-- Policy: Choferes ven sus propias asignaciones
CREATE POLICY "Choferes ven sus recorridos"
ON public.asignaciones_ruta
FOR SELECT
TO authenticated
USING (
  auth.uid() IN (
    SELECT id FROM public.choferes WHERE id = id_chofer
  )
);

-- Policy: Admins ven todas las asignaciones
CREATE POLICY "Admins ven todas las asignaciones"
ON public.asignaciones_ruta
FOR SELECT
TO authenticated
USING (
  auth.uid() IN (
    SELECT id FROM public.profiles WHERE rol = 'admin'
  )
);

-- Policy: Admins crean/modifican asignaciones
CREATE POLICY "Admins gestionan asignaciones"
ON public.asignaciones_ruta
FOR ALL
TO authenticated
USING (
  auth.uid() IN (
    SELECT id FROM public.profiles WHERE rol = 'admin'
  )
)
WITH CHECK (
  auth.uid() IN (
    SELECT id FROM public.profiles WHERE rol = 'admin'
  )
);

-- =====================================================
-- PASO 6: Función helper - Obtener recorridos del día
-- =====================================================

CREATE OR REPLACE FUNCTION get_recorridos_chofer_hoy(p_id_chofer UUID)
RETURNS TABLE (
  id UUID,
  id_ruta UUID,
  nombre_ruta VARCHAR,
  hora_inicio TIME,
  hora_fin TIME,
  descripcion VARCHAR,
  estado_ruta VARCHAR
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
    r.nombre,
    ar.hora_inicio,
    ar.hora_fin,
    ar.descripcion,
    r.estado
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
-- PASO 7: Función helper - Verificar si es hora de recorrido
-- =====================================================

CREATE OR REPLACE FUNCTION es_hora_recorrido(p_id_asignacion UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_hora_actual TIME;
  v_hora_inicio TIME;
  v_hora_fin TIME;
BEGIN
  v_hora_actual := CURRENT_TIME;

  SELECT hora_inicio, hora_fin
  INTO v_hora_inicio, v_hora_fin
  FROM public.asignaciones_ruta
  WHERE id = p_id_asignacion;

  IF v_hora_inicio IS NULL THEN
    RETURN false;
  END IF;

  -- Verificar si la hora actual está dentro del rango (con margen de 30 min antes)
  RETURN (v_hora_actual >= (v_hora_inicio - INTERVAL '30 minutes')
          AND v_hora_actual <= (v_hora_fin + INTERVAL '30 minutes'));
END;
$$;

COMMENT ON FUNCTION es_hora_recorrido IS 'Verifica si la hora actual está dentro del horario del recorrido (±30 min)';

-- =====================================================
-- FIN DE MIGRACIÓN
-- =====================================================
