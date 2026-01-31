import { supabase } from './supabase';

// Estados simples de asistencia
export type EstadoAsistencia = 'presente' | 'ausente' | 'completado';

export type Asistencia = {
  id: string;
  id_estudiante: string;
  id_chofer: string;
  id_ruta: string | null;
  estado: EstadoAsistencia;
  fecha: string;
  notas: string | null;
  modificado_por: string | null;
  created_at: string;
  updated_at: string | null;
};

export type EstudianteConAsistencia = {
  id: string;
  nombre: string;
  apellido: string;
  parada: {
    id: string;
    nombre: string | null;
    orden: number | null;
  } | null;
  estado: EstadoAsistencia;
};

/**
 * Padre marca/desmarca ausencia de su hijo
 */
export async function toggleAsistencia(
  idEstudiante: string,
  idRuta: string,
  marcarAusente: boolean
): Promise<boolean> {
  try {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) throw new Error('No autenticado');

    const hoy = new Date().toISOString().split('T')[0];

    // Verificar si ya existe registro hoy
    const { data: existente } = await supabase
      .from('asistencias')
      .select('id')
      .eq('id_estudiante', idEstudiante)
      .eq('fecha', hoy)
      .single();

    const nuevoEstado: EstadoAsistencia = marcarAusente ? 'ausente' : 'presente';

    if (existente) {
      // Actualizar existente
      const { error } = await supabase
        .from('asistencias')
        .update({
          estado: nuevoEstado,
          modificado_por: userId,
          notas: marcarAusente ? 'Marcado ausente por padre' : 'Marcado presente por padre',
        })
        .eq('id', existente.id);

      if (error) throw error;
    } else {
      // Obtener el chofer asignado a esta ruta usando RPC (bypassing RLS)
      const { data: idChofer, error: errorChofer } = await supabase
        .rpc('get_chofer_de_ruta', { p_id_ruta: idRuta });

      if (errorChofer || !idChofer) {
        console.error('❌ No hay chofer asignado a la ruta:', idRuta, errorChofer);
        throw new Error('No hay chofer asignado a esta ruta');
      }

      // Crear nuevo registro con el chofer correcto
      const { error } = await supabase
        .from('asistencias')
        .insert({
          id_estudiante: idEstudiante,
          id_chofer: idChofer,
          id_ruta: idRuta,
          estado: nuevoEstado,
          fecha: hoy,
          modificado_por: userId,
          notas: marcarAusente ? 'Marcado ausente por padre' : null,
        });

      if (error) throw error;
    }

    console.log(`✅ Asistencia actualizada: ${nuevoEstado} - ${idEstudiante}`);
    return true;
  } catch (error) {
    console.error('❌ Error en toggleAsistencia:', error);
    return false;
  }
}

/**
 * Chofer marca estudiante como ausente (no se subió)
 */
export async function marcarAusente(
  idEstudiante: string,
  idRuta: string,
  idChofer: string
): Promise<boolean> {
  try {
    const hoy = new Date().toISOString().split('T')[0];

    // Verificar si existe
    const { data: existente } = await supabase
      .from('asistencias')
      .select('id')
      .eq('id_estudiante', idEstudiante)
      .eq('fecha', hoy)
      .single();

    if (existente) {
      // Actualizar a ausente
      const { error } = await supabase
        .from('asistencias')
        .update({
          estado: 'ausente',
          modificado_por: idChofer,
          notas: 'Marcado ausente por chofer - no se subió',
        })
        .eq('id', existente.id);

      if (error) throw error;
    } else {
      // Crear como ausente
      const { error } = await supabase
        .from('asistencias')
        .insert({
          id_estudiante: idEstudiante,
          id_chofer: idChofer,
          id_ruta: idRuta,
          estado: 'ausente',
          fecha: hoy,
          modificado_por: idChofer,
          notas: 'Marcado ausente por chofer - no se subió',
        });

      if (error) throw error;
    }

    console.log(`✅ Estudiante marcado ausente: ${idEstudiante}`);
    return true;
  } catch (error) {
    console.error('❌ Error en marcarAusente:', error);
    return false;
  }
}

/**
 * Obtiene estudiantes de la ruta con su estado de asistencia
 * Por defecto todos están "presente" a menos que se marque lo contrario
 */
export async function getEstudiantesConAsistencia(
  idRuta: string,
  idChofer: string
): Promise<EstudianteConAsistencia[]> {
  try {
    console.log(`🔍 Buscando estudiantes para ruta: ${idRuta}`);

    // 1. Obtener paradas de la ruta
    const { data: paradasRuta, error: errorParadas } = await supabase
      .from('paradas')
      .select('id')
      .eq('id_ruta', idRuta);

    if (errorParadas) throw errorParadas;

    const paradasIds = (paradasRuta || []).map(p => p.id);
    if (paradasIds.length === 0) return [];

    // 2. Obtener estudiantes
    const { data: estudiantes, error: errorEstudiantes } = await supabase
      .from('estudiantes')
      .select(`
        id,
        nombre,
        apellido,
        id_parada,
        paradas(id, nombre, orden)
      `)
      .in('id_parada', paradasIds)
      .order('apellido', { ascending: true });

    if (errorEstudiantes) throw errorEstudiantes;
    if (!estudiantes || estudiantes.length === 0) return [];

    // 3. Obtener asistencias del día
    const hoy = new Date().toISOString().split('T')[0];
    const estudiantesIds = estudiantes.map((e: any) => e.id);

    const { data: asistencias } = await supabase
      .from('asistencias')
      .select('id_estudiante, estado')
      .in('id_estudiante', estudiantesIds)
      .eq('fecha', hoy);

    // 4. Combinar datos (default: presente)
    const resultado: EstudianteConAsistencia[] = estudiantes.map((est: any) => {
      const asistencia = asistencias?.find((a: any) => a.id_estudiante === est.id);

      return {
        id: est.id,
        nombre: est.nombre,
        apellido: est.apellido,
        parada: est.paradas
          ? {
              id: est.paradas.id,
              nombre: est.paradas.nombre,
              orden: est.paradas.orden,
            }
          : null,
        estado: asistencia?.estado || 'presente', // Default: presente
      };
    });

    console.log(`✅ ${resultado.length} estudiantes cargados`);
    return resultado;
  } catch (error) {
    console.error('❌ Error en getEstudiantesConAsistencia:', error);
    return [];
  }
}

/**
 * Obtiene el estado de asistencia actual de un estudiante
 */
export async function getEstadoAsistencia(
  idEstudiante: string
): Promise<EstadoAsistencia> {
  try {
    const hoy = new Date().toISOString().split('T')[0];

    const { data } = await supabase
      .from('asistencias')
      .select('estado')
      .eq('id_estudiante', idEstudiante)
      .eq('fecha', hoy)
      .single();

    return data?.estado || 'presente';
  } catch (error) {
    return 'presente'; // Default
  }
}
