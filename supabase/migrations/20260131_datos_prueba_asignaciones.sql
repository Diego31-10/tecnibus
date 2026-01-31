-- =====================================================
-- Datos de prueba para sistema de asignaciones
-- Fecha: 2026-01-31
-- Descripción: Crear datos demo para probar asignaciones
-- =====================================================

-- Nota: Este script asume que ya existen:
-- - Al menos 1 chofer en la tabla choferes
-- - Al menos 1 buseta en la tabla busetas
-- - Al menos 1 ruta en la tabla rutas
-- - Paradas asociadas a las rutas

-- =====================================================
-- PASO 1: Asignar buseta al primer chofer
-- =====================================================

-- Actualizar el primer chofer para que tenga una buseta asignada
DO $$
DECLARE
  v_id_chofer UUID;
  v_id_buseta UUID;
BEGIN
  -- Obtener el primer chofer
  SELECT id INTO v_id_chofer
  FROM choferes
  LIMIT 1;

  -- Obtener la primera buseta
  SELECT id INTO v_id_buseta
  FROM busetas
  ORDER BY placa
  LIMIT 1;

  -- Asignar buseta al chofer si ambos existen
  IF v_id_chofer IS NOT NULL AND v_id_buseta IS NOT NULL THEN
    UPDATE choferes
    SET id_buseta = v_id_buseta
    WHERE id = v_id_chofer;

    RAISE NOTICE 'Buseta asignada al chofer exitosamente';
  ELSE
    RAISE NOTICE 'No se encontraron choferes o busetas para asignar';
  END IF;
END $$;

-- =====================================================
-- PASO 2: Crear asignaciones de recorridos
-- =====================================================

-- Crear recorrido de mañana (llevar estudiantes)
DO $$
DECLARE
  v_id_chofer UUID;
  v_id_ruta UUID;
BEGIN
  -- Obtener el primer chofer
  SELECT id INTO v_id_chofer
  FROM choferes
  LIMIT 1;

  -- Obtener la primera ruta
  SELECT id INTO v_id_ruta
  FROM rutas
  WHERE estado = 'activa'
  ORDER BY nombre
  LIMIT 1;

  -- Crear asignación de mañana si ambos existen
  IF v_id_chofer IS NOT NULL AND v_id_ruta IS NOT NULL THEN
    INSERT INTO asignaciones_ruta (
      id_chofer,
      id_ruta,
      hora_inicio,
      hora_fin,
      descripcion,
      dias_semana,
      activo
    )
    VALUES (
      v_id_chofer,
      v_id_ruta,
      '06:00:00',
      '07:30:00',
      'Llevar estudiantes al colegio',
      ARRAY['lunes', 'martes', 'miércoles', 'jueves', 'viernes'],
      true
    )
    ON CONFLICT DO NOTHING;

    RAISE NOTICE 'Recorrido de mañana creado exitosamente';
  ELSE
    RAISE NOTICE 'No se encontraron choferes o rutas para crear asignación';
  END IF;
END $$;

-- Crear recorrido de tarde (recoger estudiantes)
DO $$
DECLARE
  v_id_chofer UUID;
  v_id_ruta UUID;
BEGIN
  -- Obtener el primer chofer
  SELECT id INTO v_id_chofer
  FROM choferes
  LIMIT 1;

  -- Obtener la primera ruta
  SELECT id INTO v_id_ruta
  FROM rutas
  WHERE estado = 'activa'
  ORDER BY nombre
  LIMIT 1;

  -- Crear asignación de tarde si ambos existen
  IF v_id_chofer IS NOT NULL AND v_id_ruta IS NOT NULL THEN
    INSERT INTO asignaciones_ruta (
      id_chofer,
      id_ruta,
      hora_inicio,
      hora_fin,
      descripcion,
      dias_semana,
      activo
    )
    VALUES (
      v_id_chofer,
      v_id_ruta,
      '13:00:00',
      '14:30:00',
      'Recoger estudiantes del colegio',
      ARRAY['lunes', 'martes', 'miércoles', 'jueves', 'viernes'],
      true
    )
    ON CONFLICT DO NOTHING;

    RAISE NOTICE 'Recorrido de tarde creado exitosamente';
  ELSE
    RAISE NOTICE 'No se encontraron choferes o rutas para crear asignación';
  END IF;
END $$;

-- =====================================================
-- PASO 3: Asignar estudiantes a paradas
-- =====================================================

-- Asignar estudiantes sin parada a la primera parada de su ruta
DO $$
DECLARE
  v_estudiante RECORD;
  v_primera_parada UUID;
BEGIN
  FOR v_estudiante IN
    SELECT e.id, p.id_ruta
    FROM estudiantes e
    LEFT JOIN paradas p ON e.id_parada = p.id
    WHERE e.id_parada IS NULL
  LOOP
    -- Buscar la primera parada de alguna ruta activa
    SELECT id INTO v_primera_parada
    FROM paradas
    WHERE id_ruta IN (
      SELECT id FROM rutas WHERE estado = 'activa' LIMIT 1
    )
    ORDER BY orden ASC
    LIMIT 1;

    -- Asignar parada al estudiante
    IF v_primera_parada IS NOT NULL THEN
      UPDATE estudiantes
      SET id_parada = v_primera_parada
      WHERE id = v_estudiante.id;
    END IF;
  END LOOP;

  RAISE NOTICE 'Estudiantes asignados a paradas exitosamente';
END $$;

-- =====================================================
-- PASO 4: Verificar configuración
-- =====================================================

-- Mostrar resumen de configuración
DO $$
DECLARE
  v_choferes_con_buseta INTEGER;
  v_total_asignaciones INTEGER;
  v_estudiantes_con_parada INTEGER;
BEGIN
  -- Contar choferes con buseta
  SELECT COUNT(*) INTO v_choferes_con_buseta
  FROM choferes
  WHERE id_buseta IS NOT NULL;

  -- Contar asignaciones activas
  SELECT COUNT(*) INTO v_total_asignaciones
  FROM asignaciones_ruta
  WHERE activo = true;

  -- Contar estudiantes con parada
  SELECT COUNT(*) INTO v_estudiantes_con_parada
  FROM estudiantes
  WHERE id_parada IS NOT NULL;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'RESUMEN DE CONFIGURACIÓN';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Choferes con buseta asignada: %', v_choferes_con_buseta;
  RAISE NOTICE 'Recorridos activos: %', v_total_asignaciones;
  RAISE NOTICE 'Estudiantes con parada: %', v_estudiantes_con_parada;
  RAISE NOTICE '========================================';
END $$;

-- =====================================================
-- FIN DE SCRIPT
-- =====================================================
