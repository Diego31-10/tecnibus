-- =====================================================
-- Migración: RLS para padres gestionar asistencias
-- Fecha: 2026-01-31
-- Descripción: Permitir a padres crear/actualizar asistencias con cualquier estado
-- =====================================================

-- Eliminar políticas antiguas restrictivas
DROP POLICY IF EXISTS "Padres pueden marcar ausente a sus hijos" ON asistencias;
DROP POLICY IF EXISTS "Padres pueden crear ausencia de sus hijos" ON asistencias;

-- Nueva política completa para padres
CREATE POLICY "Padres pueden gestionar asistencia de sus hijos"
ON public.asistencias
FOR ALL
TO public
USING (
  id_estudiante IN (
    SELECT id FROM estudiantes WHERE id_padre = auth.uid()
  )
)
WITH CHECK (
  id_estudiante IN (
    SELECT id FROM estudiantes WHERE id_padre = auth.uid()
  )
);

COMMENT ON POLICY "Padres pueden gestionar asistencia de sus hijos" ON asistencias
IS 'Permite a padres crear y actualizar asistencias de sus hijos (presente/ausente)';
