-- =====================================================
-- Migración: Estados de geocercas por estudiante en recorrido
-- Fecha: 2026-02-15
-- Descripción: Trackear estados de entrada/salida de geocercas
--              para cada estudiante durante el recorrido
-- =====================================================

-- Enum para estados de geocerca
CREATE TYPE estado_geocerca AS ENUM (
  'pendiente',    -- No ha llegado a la parada
  'en_zona',      -- Buseta dentro del geocerca
  'completado',   -- Estudiante recogido (presente o ausente)
  'omitido'       -- Salió sin marcar (se marca presente auto)
);

-- Tabla para trackear estados de geocercas
CREATE TABLE IF NOT EXISTS estados_geocercas_recorrido (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_recorrido UUID NOT NULL REFERENCES estados_recorrido(id) ON DELETE CASCADE,
  id_estudiante UUID NOT NULL REFERENCES estudiantes(id) ON DELETE CASCADE,
  id_parada UUID NOT NULL REFERENCES paradas(id) ON DELETE CASCADE,

  estado estado_geocerca NOT NULL DEFAULT 'pendiente',

  -- Timestamps de entrada/salida
  entrada_geocerca_at TIMESTAMPTZ,
  salida_geocerca_at TIMESTAMPTZ,

  -- Radio del geocerca usado (en metros)
  radio_metros INTEGER NOT NULL DEFAULT 100,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Un estudiante solo puede tener un estado por recorrido
  UNIQUE(id_recorrido, id_estudiante)
);

-- Índices
CREATE INDEX idx_estados_geocercas_recorrido ON estados_geocercas_recorrido(id_recorrido);
CREATE INDEX idx_estados_geocercas_estudiante ON estados_geocercas_recorrido(id_estudiante);
CREATE INDEX idx_estados_geocercas_estado ON estados_geocercas_recorrido(estado);

-- RLS
ALTER TABLE estados_geocercas_recorrido ENABLE ROW LEVEL SECURITY;

-- Política para choferes (ver y actualizar sus recorridos)
CREATE POLICY "Choferes gestionan estados de sus recorridos"
ON estados_geocercas_recorrido
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM estados_recorrido er
    WHERE er.id = estados_geocercas_recorrido.id_recorrido
      AND er.id_chofer = auth.uid()
  )
);

-- Política para padres (solo ver sus hijos)
CREATE POLICY "Padres ven estados de sus hijos"
ON estados_geocercas_recorrido
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM estudiantes e
    WHERE e.id = estados_geocercas_recorrido.id_estudiante
      AND e.id_padre = auth.uid()
  )
);

-- Política para admins
CREATE POLICY "Admins ven todos los estados"
ON estados_geocercas_recorrido
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
      AND profiles.rol = 'admin'
  )
);

-- Trigger para updated_at
CREATE TRIGGER update_estados_geocercas_updated_at
BEFORE UPDATE ON estados_geocercas_recorrido
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Comentarios
COMMENT ON TABLE estados_geocercas_recorrido IS 'Trackea estados de geocercas por estudiante durante recorridos activos';
COMMENT ON COLUMN estados_geocercas_recorrido.estado IS 'Estado actual del estudiante respecto al geocerca de su parada';
COMMENT ON COLUMN estados_geocercas_recorrido.entrada_geocerca_at IS 'Timestamp cuando la buseta entró al geocerca';
COMMENT ON COLUMN estados_geocercas_recorrido.salida_geocerca_at IS 'Timestamp cuando la buseta salió del geocerca';
