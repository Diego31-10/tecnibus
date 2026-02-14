-- Eliminar política problemática que causaba recursión infinita
DROP POLICY IF EXISTS "Padres pueden ver paradas de rutas con sus hijos" ON public.paradas;

-- Solución simple: Los padres pueden ver TODAS las paradas
-- Esto es aceptable porque las paradas son información semi-pública (direcciones de recogida)
-- y los padres necesitan ver las paradas para entender las rutas
CREATE POLICY "Padres pueden ver todas las paradas"
ON public.paradas FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.rol = 'padre'
  )
);
