-- =====================================================
-- Migración: RLS para actualizar asistencias
-- Fecha: 2026-01-31
-- Descripción: Permitir a choferes y padres actualizar asistencias
-- =====================================================

-- Choferes pueden actualizar asistencias que crearon
CREATE POLICY "Choferes pueden actualizar sus registros"
ON public.asistencias
FOR UPDATE
TO public
USING (id_chofer = auth.uid())
WITH CHECK (id_chofer = auth.uid());

-- Padres pueden actualizar asistencias de sus hijos (solo a ausente)
CREATE POLICY "Padres pueden marcar ausente a sus hijos"
ON public.asistencias
FOR UPDATE
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
  AND estado = 'ausente'::estado_asistencia
);

-- Padres pueden crear registro de ausencia para sus hijos
CREATE POLICY "Padres pueden crear ausencia de sus hijos"
ON public.asistencias
FOR INSERT
TO public
WITH CHECK (
  id_estudiante IN (
    SELECT id FROM estudiantes WHERE id_padre = auth.uid()
  )
  AND estado = 'ausente'::estado_asistencia
);

COMMENT ON POLICY "Choferes pueden actualizar sus registros" ON asistencias
IS 'Permite a choferes actualizar estados de asistencia';

COMMENT ON POLICY "Padres pueden marcar ausente a sus hijos" ON asistencias
IS 'Permite a padres actualizar solo a estado ausente';

COMMENT ON POLICY "Padres pueden crear ausencia de sus hijos" ON asistencias
IS 'Permite a padres crear registro de ausencia';
