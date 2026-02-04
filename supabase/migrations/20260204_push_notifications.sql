-- ============================================
-- MIGRACIÓN: Sistema de Notificaciones Push
-- Fecha: 2026-02-04
-- ============================================

-- 1. Agregar columna push_token a profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS push_token TEXT;

COMMENT ON COLUMN public.profiles.push_token IS 'Token de Expo Push Notifications para enviar notificaciones al dispositivo';

-- 2. Crear índice para búsquedas de push_token (no nulos)
CREATE INDEX IF NOT EXISTS idx_profiles_push_token
ON public.profiles (push_token)
WHERE push_token IS NOT NULL;

-- 3. Función RPC para obtener push tokens de padres asociados a una asignación de ruta
CREATE OR REPLACE FUNCTION public.get_push_tokens_padres_ruta(p_id_asignacion UUID)
RETURNS TABLE (
  push_token TEXT,
  nombre_padre TEXT,
  id_padre UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id_ruta UUID;
BEGIN
  -- Obtener el id_ruta de la asignación
  SELECT ar.id_ruta INTO v_id_ruta
  FROM asignaciones_ruta ar
  WHERE ar.id = p_id_asignacion;

  IF v_id_ruta IS NULL THEN
    RAISE EXCEPTION 'Asignación no encontrada: %', p_id_asignacion;
  END IF;

  -- Retornar los push tokens de padres con estudiantes en paradas de esta ruta
  RETURN QUERY
  SELECT DISTINCT
    pr.push_token,
    CONCAT(pr.nombre, ' ', pr.apellido) AS nombre_padre,
    pa.id AS id_padre
  FROM padres pa
  INNER JOIN profiles pr ON pr.id = pa.id
  INNER JOIN estudiantes e ON e.id_padre = pa.id
  INNER JOIN paradas p ON p.id = e.id_parada
  WHERE p.id_ruta = v_id_ruta
    AND pr.push_token IS NOT NULL
    AND pr.push_token != '';
END;
$$;

COMMENT ON FUNCTION public.get_push_tokens_padres_ruta IS
'Obtiene los push tokens de todos los padres que tienen estudiantes en paradas de una ruta específica';

-- 4. Función RPC para actualizar el push token del usuario actual
CREATE OR REPLACE FUNCTION public.update_push_token(p_push_token TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE profiles
  SET push_token = p_push_token
  WHERE id = auth.uid();

  RETURN FOUND;
END;
$$;

COMMENT ON FUNCTION public.update_push_token IS
'Actualiza el push token del usuario autenticado actual';

-- 5. Función RPC para eliminar el push token (al cerrar sesión)
CREATE OR REPLACE FUNCTION public.clear_push_token()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE profiles
  SET push_token = NULL
  WHERE id = auth.uid();

  RETURN FOUND;
END;
$$;

COMMENT ON FUNCTION public.clear_push_token IS
'Elimina el push token del usuario autenticado (usado al cerrar sesión)';

-- 6. Conceder permisos a usuarios autenticados
GRANT EXECUTE ON FUNCTION public.update_push_token TO authenticated;
GRANT EXECUTE ON FUNCTION public.clear_push_token TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_push_tokens_padres_ruta TO authenticated;
