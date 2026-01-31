-- =====================================================
-- Migración: RLS para padres ver paradas sin recursión
-- Fecha: 2026-01-31
-- Descripción: Permitir a padres ver paradas usando IN en lugar de EXISTS
-- =====================================================

-- Política para que padres vean paradas donde están sus estudiantes
-- Usa IN en lugar de EXISTS para evitar recursión infinita
CREATE POLICY "Parents can view paradas via IN clause"
ON public.paradas
FOR SELECT
TO public
USING (
  id IN (
    SELECT id_parada
    FROM estudiantes
    WHERE id_padre = auth.uid()
      AND id_parada IS NOT NULL
  )
);

COMMENT ON POLICY "Parents can view paradas via IN clause" ON public.paradas
IS 'Permite a padres ver paradas de sus estudiantes usando IN para evitar recursión';
