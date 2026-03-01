-- =====================================================
-- Migración: Bucket privado para reportes PDF
-- Fecha: 2026-03-01
-- Descripción: Almacenamiento seguro de reportes generados
-- =====================================================

-- Crear bucket privado para reportes
INSERT INTO storage.buckets (id, name, public)
VALUES ('reportes', 'reportes', false)
ON CONFLICT (id) DO NOTHING;

-- RLS: Solo service_role puede insertar (Edge Functions)
-- No se necesita policy INSERT para authenticated porque
-- las Edge Functions usan service_role_key directamente.

-- RLS: Admins pueden leer objetos del bucket (para signed URLs)
CREATE POLICY "Admins pueden leer reportes"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'reportes'
  AND auth.uid() IN (
    SELECT id FROM public.profiles WHERE rol = 'admin'
  )
);
