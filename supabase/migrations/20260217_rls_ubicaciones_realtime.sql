-- Migración: Política RLS para que padres puedan suscribirse a Realtime de ubicaciones_bus
-- Fecha: 2026-02-17
-- Motivo: La app del padre usará WebSocket (Realtime) en lugar de polling de 5s

-- La tabla ubicaciones_bus ya tiene RLS habilitado.
-- Esta política SELECT permite a padres autenticados leer ubicaciones
-- solo de las asignaciones activas donde tienen un hijo registrado.

CREATE POLICY "Padres pueden leer ubicaciones de su ruta"
  ON public.ubicaciones_bus
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.estudiantes e
      JOIN public.paradas p ON p.id = e.id_parada
      JOIN public.asignaciones_ruta ar ON ar.id_ruta = p.id_ruta
      WHERE e.id_padre = auth.uid()
        AND ar.id = ubicaciones_bus.id_asignacion
        AND ar.activo = true
    )
  );
