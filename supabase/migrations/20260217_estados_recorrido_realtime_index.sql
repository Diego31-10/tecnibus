-- Índice en id_asignacion para que Supabase Realtime pueda filtrar por esta columna.
-- Sin este índice, los filtros postgres_changes con id_asignacion=eq.X son rechazados silenciosamente.
CREATE INDEX IF NOT EXISTS idx_estados_recorrido_id_asignacion
  ON public.estados_recorrido(id_asignacion);

-- REPLICA IDENTITY FULL garantiza que los payloads de UPDATE en Realtime
-- incluyan todas las columnas (incluyendo eta_paradas) y no solo la PK.
ALTER TABLE public.estados_recorrido REPLICA IDENTITY FULL;
