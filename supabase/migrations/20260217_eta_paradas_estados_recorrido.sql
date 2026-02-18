-- Columna para que el chofer publique ETAs calculados y los padres los lean
ALTER TABLE estados_recorrido
  ADD COLUMN IF NOT EXISTS eta_paradas JSONB DEFAULT NULL;

COMMENT ON COLUMN estados_recorrido.eta_paradas IS
  'ETAs en minutos calculados por el chofer. Formato: {"parada_uuid": 5, "colegio": 25}';
