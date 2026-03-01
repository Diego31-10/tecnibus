-- =====================================================
-- Migración: Tabla de auditoría de importaciones masivas
-- Fecha: 2026-03-01
-- Descripción: Trazabilidad de importaciones CSV/JSON
-- =====================================================

CREATE TABLE IF NOT EXISTS public.import_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  total_rows INT NOT NULL,
  inserted INT NOT NULL,
  errors INT NOT NULL,
  error_details JSONB DEFAULT '[]'::jsonb,
  admin_id UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE public.import_logs ENABLE ROW LEVEL SECURITY;

-- Solo admins pueden ver logs de importación
CREATE POLICY "Admins pueden ver import_logs"
ON public.import_logs
FOR SELECT
TO authenticated
USING (
  auth.uid() IN (
    SELECT id FROM public.profiles WHERE rol = 'admin'
  )
);

-- Solo service_role inserta (Edge Functions)
-- No se necesita policy INSERT para authenticated

COMMENT ON TABLE public.import_logs IS 'Registro de auditoría de importaciones masivas de entidades';
