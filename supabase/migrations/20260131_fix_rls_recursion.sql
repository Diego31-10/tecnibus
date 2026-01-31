-- =====================================================
-- Migración: Fix recursión infinita en RLS
-- Fecha: 2026-01-31
-- Descripción: Reemplazar políticas que causan ciclos
-- =====================================================

-- Eliminar política problemática de padres en rutas
DROP POLICY IF EXISTS "Parents can view routes of their students" ON public.rutas;

-- Eliminar política genérica de paradas que causa el problema
DROP POLICY IF EXISTS "Users can view paradas of allowed rutas" ON public.paradas;

-- Nueva política: Choferes pueden ver paradas de sus rutas asignadas
CREATE POLICY "Choferes can view paradas of assigned routes"
ON public.paradas
FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1
    FROM asignaciones_ruta ar
    WHERE ar.id_ruta = paradas.id_ruta
      AND ar.id_chofer = auth.uid()
      AND ar.activo = true
  )
);

-- Nueva política: Padres pueden ver paradas donde están sus estudiantes
CREATE POLICY "Parents can view paradas of their students"
ON public.paradas
FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1
    FROM estudiantes e
    WHERE e.id_parada = paradas.id
      AND e.id_padre = auth.uid()
  )
);

COMMENT ON POLICY "Choferes can view paradas of assigned routes" ON public.paradas
IS 'Permite a choferes ver paradas de rutas asignadas sin recursión';

COMMENT ON POLICY "Parents can view paradas of their students" ON public.paradas
IS 'Permite a padres ver paradas donde están sus estudiantes sin recursión';
