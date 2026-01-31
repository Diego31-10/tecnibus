-- =====================================================
-- Migración: RLS para choferes y padres ver rutas
-- Fecha: 2026-01-31
-- Descripción: Permitir a choferes y padres ver rutas
-- =====================================================

-- Política para que choferes vean rutas que tienen asignadas
CREATE POLICY "Choferes can view their assigned routes"
ON public.rutas
FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1
    FROM asignaciones_ruta ar
    WHERE ar.id_ruta = rutas.id
      AND ar.id_chofer = auth.uid()
      AND ar.activo = true
  )
);

-- Política para que padres vean rutas de sus estudiantes
CREATE POLICY "Parents can view routes of their students"
ON public.rutas
FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1
    FROM estudiantes e
    JOIN paradas p ON p.id = e.id_parada
    WHERE p.id_ruta = rutas.id
      AND e.id_padre = auth.uid()
  )
);

COMMENT ON POLICY "Choferes can view their assigned routes" ON public.rutas
IS 'Permite a choferes ver rutas que tienen asignadas';

COMMENT ON POLICY "Parents can view routes of their students" ON public.rutas
IS 'Permite a padres ver rutas de sus estudiantes';
