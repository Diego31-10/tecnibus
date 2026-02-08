-- Tabla para almacenar el historial de posiciones GPS del bus
CREATE TABLE IF NOT EXISTS public.ubicaciones_bus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_asignacion UUID NOT NULL REFERENCES public.asignaciones_ruta(id) ON DELETE CASCADE,
  id_chofer UUID NOT NULL REFERENCES public.choferes(id) ON DELETE CASCADE,
  latitud DOUBLE PRECISION NOT NULL,
  longitud DOUBLE PRECISION NOT NULL,
  velocidad DOUBLE PRECISION, -- km/h
  precision_gps DOUBLE PRECISION, -- en metros
  ubicacion_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para queries rápidas
CREATE INDEX idx_ubicaciones_bus_asignacion ON public.ubicaciones_bus(id_asignacion);
CREATE INDEX idx_ubicaciones_bus_timestamp ON public.ubicaciones_bus(ubicacion_timestamp DESC);
CREATE INDEX idx_ubicaciones_bus_asignacion_timestamp ON public.ubicaciones_bus(id_asignacion, ubicacion_timestamp DESC);

-- RLS Policies
ALTER TABLE public.ubicaciones_bus ENABLE ROW LEVEL SECURITY;

-- Choferes insertan sus ubicaciones
CREATE POLICY "Choferes insertan sus ubicaciones"
ON public.ubicaciones_bus FOR INSERT TO authenticated
WITH CHECK (id_chofer = auth.uid());

-- Padres ven ubicaciones de buses donde tienen hijos
CREATE POLICY "Padres ven ubicaciones de buses de sus hijos"
ON public.ubicaciones_bus FOR SELECT TO authenticated
USING (
  id_asignacion IN (
    SELECT ar.id FROM asignaciones_ruta ar
    JOIN paradas p ON p.id_ruta = ar.id_ruta
    JOIN estudiantes e ON e.id_parada = p.id
    WHERE e.id_padre = auth.uid()
  )
);

-- Admins ven todo
CREATE POLICY "Admins ven todas las ubicaciones"
ON public.ubicaciones_bus FOR SELECT TO authenticated
USING (auth.uid() IN (SELECT id FROM public.profiles WHERE rol = 'admin'));

-- Función RPC para obtener última ubicación
CREATE OR REPLACE FUNCTION get_ultima_ubicacion_bus(p_id_asignacion UUID)
RETURNS TABLE (
  latitud DOUBLE PRECISION,
  longitud DOUBLE PRECISION,
  velocidad DOUBLE PRECISION,
  precision_gps DOUBLE PRECISION,
  ubicacion_timestamp TIMESTAMPTZ
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT ub.latitud, ub.longitud, ub.velocidad, ub.precision_gps, ub.ubicacion_timestamp
  FROM ubicaciones_bus ub
  WHERE ub.id_asignacion = p_id_asignacion
  ORDER BY ub.ubicacion_timestamp DESC LIMIT 1;
END;
$$;

-- Habilitar Realtime (CRÍTICO para tracking en vivo)
ALTER TABLE ubicaciones_bus REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE ubicaciones_bus;
