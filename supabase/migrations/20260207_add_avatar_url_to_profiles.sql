-- Agregar columna avatar_url a la tabla profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Comentario de la columna
COMMENT ON COLUMN public.profiles.avatar_url IS 'URL pública del avatar del usuario desde Supabase Storage';

-- Crear bucket de avatares en Storage (si no existe)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatares', 'avatares', true)
ON CONFLICT (id) DO NOTHING;

-- Política de Storage: Cualquier usuario autenticado puede subir avatares
CREATE POLICY "Usuarios pueden subir avatares"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'avatares');

-- Política de Storage: Usuarios pueden actualizar avatares
CREATE POLICY "Usuarios pueden actualizar avatares"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'avatares');

-- Política de Storage: Usuarios pueden eliminar avatares
CREATE POLICY "Usuarios pueden eliminar avatares"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'avatares');

-- Política de Storage: Todos pueden ver avatares (bucket público)
CREATE POLICY "Avatares son públicos"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'avatares');
