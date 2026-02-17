-- =====================================================
-- Migración: Estados de recorrido en tiempo real
-- Fecha: 2026-01-31
-- Descripción: Trackear si un recorrido está activo (chofer en camino)
-- =====================================================

-- Crear tabla para estados de recorrido
CREATE TABLE IF NOT EXISTS public.estados_recorrido (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_asignacion UUID NOT NULL REFERENCES public.asignaciones_ruta(id) ON DELETE CASCADE,
  id_chofer UUID NOT NULL REFERENCES public.choferes(id) ON DELETE CASCADE,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  activo BOOLEAN NOT NULL DEFAULT false,
  hora_inicio TIMESTAMPTZ,
  hora_fin TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Un recorrido solo puede tener un estado por día
  CONSTRAINT unique_asignacion_fecha UNIQUE (id_asignacion, fecha)
);

-- Índices
CREATE INDEX idx_estados_recorrido_asignacion ON public.estados_recorrido(id_asignacion);
CREATE INDEX idx_estados_recorrido_chofer ON public.estados_recorrido(id_chofer);
CREATE INDEX idx_estados_recorrido_fecha ON public.estados_recorrido(fecha);
CREATE INDEX idx_estados_recorrido_activo ON public.estados_recorrido(activo) WHERE activo = true;

-- Comentarios
COMMENT ON TABLE public.estados_recorrido IS 'Estados de recorridos activos (si el chofer está en camino)';
COMMENT ON COLUMN public.estados_recorrido.activo IS 'true = chofer en camino, false = recorrido no iniciado o finalizado';

-- =====================================================
-- Trigger para actualizar updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION update_estados_recorrido_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_estados_recorrido_updated_at
BEFORE UPDATE ON public.estados_recorrido
FOR EACH ROW
EXECUTE FUNCTION update_estados_recorrido_updated_at();

-- =====================================================
-- RLS Policies
-- =====================================================

ALTER TABLE public.estados_recorrido ENABLE ROW LEVEL SECURITY;

-- Choferes pueden ver y gestionar sus propios estados
CREATE POLICY "Choferes ven sus estados de recorrido"
ON public.estados_recorrido
FOR SELECT
TO authenticated
USING (id_chofer = auth.uid());

CREATE POLICY "Choferes actualizan sus estados de recorrido"
ON public.estados_recorrido
FOR ALL
TO authenticated
USING (id_chofer = auth.uid())
WITH CHECK (id_chofer = auth.uid());

-- Padres pueden ver estados de recorridos donde tienen hijos
CREATE POLICY "Padres ven estados de recorridos de sus hijos"
ON public.estados_recorrido
FOR SELECT
TO authenticated
USING (
  id_asignacion IN (
    SELECT ar.id
    FROM asignaciones_ruta ar
    JOIN paradas p ON p.id_ruta = ar.id_ruta
    JOIN estudiantes e ON e.id_parada = p.id
    WHERE e.id_padre = auth.uid()
  )
);

-- Admins ven todo
CREATE POLICY "Admins ven todos los estados"
ON public.estados_recorrido
FOR SELECT
TO authenticated
USING (
  auth.uid() IN (
    SELECT id FROM public.profiles WHERE rol = 'admin'
  )
);

-- =====================================================
-- Funciones RPC
-- =====================================================

-- Iniciar recorrido
CREATE OR REPLACE FUNCTION iniciar_recorrido(p_id_asignacion UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_id_chofer UUID;
BEGIN
  -- Obtener el chofer de la asignación
  SELECT id_chofer INTO v_id_chofer
  FROM asignaciones_ruta
  WHERE id = p_id_asignacion;

  IF v_id_chofer IS NULL THEN
    RAISE EXCEPTION 'Asignación no encontrada';
  END IF;

  -- Insertar o actualizar el estado
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

-- Finalizar recorrido
CREATE OR REPLACE FUNCTION finalizar_recorrido(p_id_asignacion UUID)
RETURNS BOOLEAN
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
    AND fecha = CURRENT_DATE;

  RETURN FOUND;
END;
$$;

-- Obtener estado de recorrido
CREATE OR REPLACE FUNCTION get_estado_recorrido(p_id_asignacion UUID)
RETURNS TABLE (
  activo BOOLEAN,
  hora_inicio TIMESTAMPTZ,
  hora_fin TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    er.activo,
    er.hora_inicio,
    er.hora_fin
  FROM estados_recorrido er
  WHERE er.id_asignacion = p_id_asignacion
    AND er.fecha = CURRENT_DATE;
END;
$$;

-- Comentarios en funciones
COMMENT ON FUNCTION iniciar_recorrido IS 'Marca un recorrido como activo (chofer en camino)';
COMMENT ON FUNCTION finalizar_recorrido IS 'Marca un recorrido como finalizado';
COMMENT ON FUNCTION get_estado_recorrido IS 'Obtiene el estado actual de un recorrido';

-- =====================================================
-- Habilitar Realtime
-- =====================================================

ALTER TABLE estados_recorrido REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE estados_recorrido;

COMMENT ON TABLE estados_recorrido IS 'Estados de recorridos con actualización en tiempo real habilitada';
