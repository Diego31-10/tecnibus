-- Permitir a padres ver las rutas de sus estudiantes
-- Fecha: 2026-01-29
-- Descripción: Agrega política RLS que permite a padres hacer SELECT
-- en la tabla rutas solo para las rutas de sus estudiantes asignados

CREATE POLICY "Parents can view routes of their students"
ON rutas FOR SELECT
USING (
  id IN (
    SELECT id_ruta
    FROM estudiantes
    WHERE id_padre = auth.uid()
      AND id_ruta IS NOT NULL
  )
);
