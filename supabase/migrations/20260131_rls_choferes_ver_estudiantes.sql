-- =====================================================
-- Migración: RLS para choferes ver estudiantes
-- Fecha: 2026-01-31
-- Descripción: Permitir a choferes ver estudiantes de sus rutas
-- =====================================================

-- Política para que choferes vean estudiantes de sus rutas asignadas
CREATE POLICY "Choferes can view students in their assigned routes"
ON public.estudiantes
FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1
    FROM asignaciones_ruta ar
    JOIN paradas p ON p.id_ruta = ar.id_ruta
    WHERE ar.id_chofer = auth.uid()
      AND p.id = estudiantes.id_parada
      AND ar.activo = true
  )
);

COMMENT ON POLICY "Choferes can view students in their assigned routes" ON public.estudiantes
IS 'Permite a choferes ver estudiantes que están en paradas de rutas asignadas a ellos';
