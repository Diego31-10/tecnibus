-- =====================================================
-- Migración: Crear tabla asistencias para check-in
-- Fecha: 2026-01-31
-- Descripción: Sistema de check-in/out de estudiantes
-- =====================================================

-- Crear tabla asistencias
CREATE TABLE IF NOT EXISTS public.asistencias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_estudiante UUID NOT NULL REFERENCES public.estudiantes(id) ON DELETE CASCADE,
  id_chofer UUID NOT NULL REFERENCES public.choferes(id) ON DELETE CASCADE,
  tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('subida', 'bajada')),
  fecha_hora TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  latitud DECIMAL(10, 8) NULL,
  longitud DECIMAL(11, 8) NULL,
  notas TEXT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para mejorar performance
CREATE INDEX idx_asistencias_estudiante ON public.asistencias(id_estudiante);
CREATE INDEX idx_asistencias_chofer ON public.asistencias(id_chofer);
CREATE INDEX idx_asistencias_fecha ON public.asistencias(fecha_hora);
CREATE INDEX idx_asistencias_tipo ON public.asistencias(tipo);

-- Índice compuesto para queries frecuentes
CREATE INDEX idx_asistencias_estudiante_fecha ON public.asistencias(id_estudiante, fecha_hora DESC);

-- Comentarios
COMMENT ON TABLE public.asistencias IS 'Registro de check-in/check-out de estudiantes en busetas';
COMMENT ON COLUMN public.asistencias.tipo IS 'Tipo de asistencia: subida o bajada';
COMMENT ON COLUMN public.asistencias.latitud IS 'Latitud GPS donde se registró el check-in (opcional)';
COMMENT ON COLUMN public.asistencias.longitud IS 'Longitud GPS donde se registró el check-in (opcional)';

-- =====================================================
-- RLS (Row Level Security) Policies
-- =====================================================

-- Habilitar RLS
ALTER TABLE public.asistencias ENABLE ROW LEVEL SECURITY;

-- Policy: Choferes pueden insertar asistencias
CREATE POLICY "Choferes pueden registrar asistencias"
ON public.asistencias
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IN (
    SELECT id FROM public.choferes WHERE id = id_chofer
  )
);

-- Policy: Choferes pueden ver sus propias asistencias
CREATE POLICY "Choferes pueden ver sus registros"
ON public.asistencias
FOR SELECT
TO authenticated
USING (
  auth.uid() IN (
    SELECT id FROM public.choferes WHERE id = id_chofer
  )
);

-- Policy: Padres pueden ver asistencias de sus hijos
CREATE POLICY "Padres pueden ver asistencias de sus hijos"
ON public.asistencias
FOR SELECT
TO authenticated
USING (
  id_estudiante IN (
    SELECT id FROM public.estudiantes WHERE id_padre = auth.uid()
  )
);

-- Policy: Admins pueden ver todo
CREATE POLICY "Admins pueden ver todas las asistencias"
ON public.asistencias
FOR SELECT
TO authenticated
USING (
  auth.uid() IN (
    SELECT id FROM public.profiles WHERE rol = 'admin'
  )
);

-- Policy: Admins pueden eliminar asistencias (correcciones)
CREATE POLICY "Admins pueden eliminar asistencias"
ON public.asistencias
FOR DELETE
TO authenticated
USING (
  auth.uid() IN (
    SELECT id FROM public.profiles WHERE rol = 'admin'
  )
);

-- =====================================================
-- Función helper: Obtener última asistencia de un estudiante hoy
-- =====================================================

CREATE OR REPLACE FUNCTION get_ultima_asistencia_hoy(p_id_estudiante UUID)
RETURNS TABLE (
  id UUID,
  tipo VARCHAR(10),
  fecha_hora TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.id,
    a.tipo,
    a.fecha_hora
  FROM public.asistencias a
  WHERE a.id_estudiante = p_id_estudiante
    AND DATE(a.fecha_hora) = CURRENT_DATE
  ORDER BY a.fecha_hora DESC
  LIMIT 1;
END;
$$;

COMMENT ON FUNCTION get_ultima_asistencia_hoy IS 'Obtiene la última asistencia registrada hoy para un estudiante';

-- =====================================================
-- Función helper: Verificar si estudiante está en buseta
-- =====================================================

CREATE OR REPLACE FUNCTION esta_en_buseta(p_id_estudiante UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_ultimo_tipo VARCHAR(10);
BEGIN
  SELECT tipo INTO v_ultimo_tipo
  FROM public.asistencias
  WHERE id_estudiante = p_id_estudiante
    AND DATE(fecha_hora) = CURRENT_DATE
  ORDER BY fecha_hora DESC
  LIMIT 1;

  -- Si no hay registros hoy, está fuera
  IF v_ultimo_tipo IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Si último registro fue "subida", está dentro
  -- Si fue "bajada", está fuera
  RETURN (v_ultimo_tipo = 'subida');
END;
$$;

COMMENT ON FUNCTION esta_en_buseta IS 'Verifica si un estudiante está actualmente en la buseta (último registro es "subida")';
