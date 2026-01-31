-- =====================================================
-- Migración: Mejorar tabla asistencias para sistema completo
-- Fecha: 2026-01-31
-- Descripción: Preparar asistencias para flujo manual y futuras geocercas
-- =====================================================

-- Crear enum para estados de asistencia
DO $$ BEGIN
  CREATE TYPE estado_asistencia AS ENUM (
    'pendiente',    -- Aún no llega a la parada
    'recogiendo',   -- Dentro de geocerca (futuro automático)
    'abordo',       -- Subió al bus
    'ausente',      -- No se subió / No asistirá
    'dejando',      -- Dentro de geocerca destino (futuro)
    'dejado'        -- Entregado en su parada
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Agregar nuevas columnas a asistencias
ALTER TABLE asistencias
  ADD COLUMN IF NOT EXISTS id_ruta uuid REFERENCES rutas(id),
  ADD COLUMN IF NOT EXISTS estado estado_asistencia DEFAULT 'pendiente',
  ADD COLUMN IF NOT EXISTS fecha date DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS hora_recogida timestamptz,
  ADD COLUMN IF NOT EXISTS hora_entrega timestamptz,
  ADD COLUMN IF NOT EXISTS ubicacion_recogida point,
  ADD COLUMN IF NOT EXISTS ubicacion_entrega point,
  ADD COLUMN IF NOT EXISTS modificado_por uuid REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_asistencias_estudiante_fecha
  ON asistencias(id_estudiante, fecha);

CREATE INDEX IF NOT EXISTS idx_asistencias_chofer_fecha
  ON asistencias(id_chofer, fecha);

CREATE INDEX IF NOT EXISTS idx_asistencias_ruta_fecha
  ON asistencias(id_ruta, fecha);

-- Crear función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_asistencias_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para updated_at
DROP TRIGGER IF EXISTS trigger_asistencias_updated_at ON asistencias;
CREATE TRIGGER trigger_asistencias_updated_at
  BEFORE UPDATE ON asistencias
  FOR EACH ROW
  EXECUTE FUNCTION update_asistencias_updated_at();

-- Crear constraint único: un estudiante solo puede tener una asistencia por día
CREATE UNIQUE INDEX IF NOT EXISTS idx_asistencias_estudiante_fecha_unique
  ON asistencias(id_estudiante, fecha);

COMMENT ON TABLE asistencias IS 'Registro de asistencia de estudiantes con soporte para geocercas futuras';
COMMENT ON COLUMN asistencias.estado IS 'Estado del flujo de asistencia: pendiente → recogiendo → abordo/ausente → dejando → dejado';
COMMENT ON COLUMN asistencias.modificado_por IS 'Usuario que hizo la última modificación (padre o chofer)';
