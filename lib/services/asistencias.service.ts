import { supabase } from './supabase';

export type TipoAsistencia = 'subida' | 'bajada';

export type Asistencia = {
  id: string;
  id_estudiante: string;
  id_chofer: string;
  tipo: TipoAsistencia;
  fecha_hora: string;
  latitud: number | null;
  longitud: number | null;
  notas: string | null;
  created_at: string | null;
};

export type CreateAsistenciaDto = {
  id_estudiante: string;
  id_chofer: string;
  tipo: TipoAsistencia;
  latitud?: number;
  longitud?: number;
  notas?: string;
};

export type EstudianteConAsistencia = {
  id: string;
  nombre: string;
  apellido: string;
  id_ruta: string | null;
  ultimaAsistencia: {
    tipo: TipoAsistencia;
    fecha_hora: string;
  } | null;
  enBuseta: boolean;
};

/**
 * Registra una asistencia (subida o bajada)
 */
export async function registrarAsistencia(
  dto: CreateAsistenciaDto
): Promise<Asistencia | null> {
  try {
    const { data, error } = await supabase
      .from('asistencias')
      .insert({
        id_estudiante: dto.id_estudiante,
        id_chofer: dto.id_chofer,
        tipo: dto.tipo,
        latitud: dto.latitud || null,
        longitud: dto.longitud || null,
        notas: dto.notas || null,
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error registrando asistencia:', error);
      throw error;
    }

    console.log(`✅ Asistencia registrada: ${dto.tipo} - ${dto.id_estudiante}`);
    return data as Asistencia;
  } catch (error) {
    console.error('❌ Error en registrarAsistencia:', error);
    return null;
  }
}

/**
 * Obtiene las asistencias del día actual
 */
export async function getAsistenciasHoy(idChofer: string): Promise<Asistencia[]> {
  try {
    const hoy = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    const { data, error } = await supabase
      .from('asistencias')
      .select('*')
      .eq('id_chofer', idChofer)
      .gte('fecha_hora', `${hoy}T00:00:00`)
      .lte('fecha_hora', `${hoy}T23:59:59`)
      .order('fecha_hora', { ascending: false });

    if (error) {
      console.error('❌ Error obteniendo asistencias del día:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('❌ Error en getAsistenciasHoy:', error);
    return [];
  }
}

/**
 * Obtiene estudiantes de la ruta con su estado de asistencia
 */
export async function getEstudiantesConAsistencia(
  idRuta: string,
  idChofer: string
): Promise<EstudianteConAsistencia[]> {
  try {
    // 1. Obtener estudiantes de la ruta
    const { data: estudiantes, error: errorEstudiantes } = await supabase
      .from('estudiantes')
      .select('id, nombre, apellido, id_ruta')
      .eq('id_ruta', idRuta)
      .order('apellido', { ascending: true });

    if (errorEstudiantes) {
      console.error('❌ Error obteniendo estudiantes:', errorEstudiantes);
      throw errorEstudiantes;
    }

    if (!estudiantes || estudiantes.length === 0) {
      console.log('⚠️ No hay estudiantes en esta ruta');
      return [];
    }

    // 2. Obtener asistencias del día
    const hoy = new Date().toISOString().split('T')[0];
    const { data: asistencias, error: errorAsistencias } = await supabase
      .from('asistencias')
      .select('id_estudiante, tipo, fecha_hora')
      .eq('id_chofer', idChofer)
      .gte('fecha_hora', `${hoy}T00:00:00`)
      .lte('fecha_hora', `${hoy}T23:59:59`)
      .order('fecha_hora', { ascending: false });

    if (errorAsistencias) {
      console.error('❌ Error obteniendo asistencias:', errorAsistencias);
      throw errorAsistencias;
    }

    // 3. Combinar datos
    const estudiantesConAsistencia: EstudianteConAsistencia[] = estudiantes.map((est) => {
      // Buscar la última asistencia de este estudiante hoy
      const ultimaAsistencia = asistencias?.find(
        (asist) => asist.id_estudiante === est.id
      );

      const enBuseta = ultimaAsistencia?.tipo === 'subida';

      return {
        id: est.id,
        nombre: est.nombre,
        apellido: est.apellido,
        id_ruta: est.id_ruta,
        ultimaAsistencia: ultimaAsistencia
          ? {
              tipo: ultimaAsistencia.tipo as TipoAsistencia,
              fecha_hora: ultimaAsistencia.fecha_hora,
            }
          : null,
        enBuseta,
      };
    });

    console.log(`✅ ${estudiantesConAsistencia.length} estudiantes con asistencia cargados`);
    return estudiantesConAsistencia;
  } catch (error) {
    console.error('❌ Error en getEstudiantesConAsistencia:', error);
    return [];
  }
}

/**
 * Verifica si un estudiante está actualmente en la buseta
 * Usa la función de Supabase para optimizar performance
 */
export async function estaEnBuseta(idEstudiante: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('esta_en_buseta', {
      p_id_estudiante: idEstudiante,
    });

    if (error) {
      console.error('❌ Error verificando si está en buseta:', error);
      return false;
    }

    return data || false;
  } catch (error) {
    console.error('❌ Error en estaEnBuseta:', error);
    return false;
  }
}

/**
 * Obtiene historial de asistencias de un estudiante
 */
export async function getHistorialAsistencias(
  idEstudiante: string,
  limite: number = 50
): Promise<Asistencia[]> {
  try {
    const { data, error } = await supabase
      .from('asistencias')
      .select('*')
      .eq('id_estudiante', idEstudiante)
      .order('fecha_hora', { ascending: false })
      .limit(limite);

    if (error) {
      console.error('❌ Error obteniendo historial:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('❌ Error en getHistorialAsistencias:', error);
    return [];
  }
}

/**
 * Elimina una asistencia (solo admins o correcciones)
 */
export async function eliminarAsistencia(idAsistencia: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('asistencias')
      .delete()
      .eq('id', idAsistencia);

    if (error) {
      console.error('❌ Error eliminando asistencia:', error);
      throw error;
    }

    console.log('✅ Asistencia eliminada:', idAsistencia);
    return true;
  } catch (error) {
    console.error('❌ Error en eliminarAsistencia:', error);
    return false;
  }
}
