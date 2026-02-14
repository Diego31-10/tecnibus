-- Eliminar política antigua que no funciona correctamente
DROP POLICY IF EXISTS "Choferes insertan sus ubicaciones" ON public.ubicaciones_bus;

-- Nueva política: Los choferes pueden insertar ubicaciones solo si:
-- 1. Son choferes (existe en tabla choferes)
-- 2. El id_chofer en el insert coincide con su auth.uid()
CREATE POLICY "Choferes insertan sus ubicaciones"
ON public.ubicaciones_bus FOR INSERT TO authenticated
WITH CHECK (
  id_chofer = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.choferes
    WHERE choferes.id = auth.uid()
  )
);
