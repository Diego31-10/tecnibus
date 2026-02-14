-- Crear tabla configuracion si no existe
CREATE TABLE IF NOT EXISTS configuracion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clave TEXT UNIQUE NOT NULL,
  valor JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insertar registro por defecto para ubicacion_colegio si no existe
INSERT INTO configuracion (clave, valor)
VALUES (
  'ubicacion_colegio',
  '{"latitud": -2.9, "longitud": -79.0, "nombre": "Colegio TecniBus"}'::jsonb
)
ON CONFLICT (clave) DO NOTHING;

-- Habilitar RLS
ALTER TABLE configuracion ENABLE ROW LEVEL SECURITY;

-- Política: Todos pueden leer configuracion
CREATE POLICY "Todos pueden leer configuracion"
ON configuracion FOR SELECT
TO authenticated
USING (true);

-- Política: Solo admins pueden actualizar configuracion
CREATE POLICY "Solo admins pueden actualizar configuracion"
ON configuracion FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.rol = 'admin'
  )
);

-- Política: Solo admins pueden insertar configuracion
CREATE POLICY "Solo admins pueden insertar configuracion"
ON configuracion FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.rol = 'admin'
  )
);

-- Crear índice en clave para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_configuracion_clave ON configuracion(clave);
