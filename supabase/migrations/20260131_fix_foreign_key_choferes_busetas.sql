-- =====================================================
-- Migración: Agregar foreign key choferes → busetas
-- Fecha: 2026-01-31
-- Descripción: Crear relación FK faltante
-- =====================================================

-- Agregar foreign key constraint
ALTER TABLE public.choferes
ADD CONSTRAINT choferes_id_buseta_fkey
FOREIGN KEY (id_buseta)
REFERENCES public.busetas(id)
ON DELETE SET NULL;

-- Crear índice para mejorar performance
CREATE INDEX IF NOT EXISTS idx_choferes_buseta ON public.choferes(id_buseta);

COMMENT ON CONSTRAINT choferes_id_buseta_fkey ON public.choferes IS 'Relación chofer → buseta asignada';
