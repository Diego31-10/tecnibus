-- =====================================================
-- Migración: RLS para que choferes actualicen polyline
-- Fecha: 2026-02-14
-- Descripción: Permite a los choferes actualizar el polyline_coordinates
--              de sus propias asignaciones
-- =====================================================

-- Permitir a choferes actualizar el polyline de sus asignaciones
CREATE POLICY "Choferes actualizan polyline de sus asignaciones"
ON asignaciones_ruta FOR UPDATE
USING (
  auth.uid() IN (
    SELECT id FROM choferes WHERE id = asignaciones_ruta.id_chofer
  )
)
WITH CHECK (
  auth.uid() IN (
    SELECT id FROM choferes WHERE id = asignaciones_ruta.id_chofer
  )
);

COMMENT ON POLICY "Choferes actualizan polyline de sus asignaciones" ON asignaciones_ruta
IS 'Permite a choferes actualizar el polyline_coordinates de sus asignaciones al iniciar recorrido';
