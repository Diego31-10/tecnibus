import { supabase } from './supabase';

// Estados de asistencia (sync con enum DB)
export type EstadoAsistencia =
  | 'pendiente'    // Aún no llega a la parada
  | 'recogiendo'   // Dentro de geocerca (futuro automático)
  | 'abordo'       // Subió al bus
  | 'ausente'      // No se subió / No asistirá
  | 'dejando'      // Dentro de geocerca destino (futuro)
  | 'dejado';      // Entregado en su parada

export type Asistencia = {
  id: string;
  id_estudiante: string;
  id_chofer: string;
  id_ruta: string | null;
  estado: EstadoAsistencia;
  fecha: string; // YYYY-MM-DD
  hora_recogida: string | null;
  hora_entrega: string | null;
  ubicacion_recogida: { x: number; y: number } | null;
  ubicacion_entrega: { x: number; y: number } | null;
  notas: string | null;
  modificado_por: string | null;
  created_at: string;
  updated_at: string | null;
};

export type CreateAsistenciaDto = {
  id_estudiante: string;
  id_chofer: string;
  id_ruta: string;
  estado: EstadoAsistencia;
  latitud?: number;
  longitud?: number;
  notas?: string;
};

export type UpdateAsistenciaDto = {
  estado: EstadoAsistencia;
  latitud?: number;
  longitud?: number;
  notas?: string;
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
  asistenciaHoy: Asistencia | null;
  estado: EstadoAsistencia;
};

/**
 * Crea o actualiza asistencia del día para un estudiante
 * Si ya existe, la actualiza. Si no, la crea.
 */
export async function marcarAsistencia(
  dto: CreateAsistenciaDto
): Promise<Asistencia | null> {
  try {
    const hoy = new Date().toISOString().split('T')[0];
    const userId = (await supabase.auth.getUser()).data.user?.id;

    // Verificar si ya existe asistencia hoy
    const { data: existente, error: errorCheck } = await supabase
      .from('asistencias')
      .select('id')
      .eq('id_estudiante', dto.id_estudiante)
      .eq('fecha', hoy)
      .single();

    if (errorCheck && errorCheck.code !== 'PGRST116') {
      // PGRST116 = no encontrado (ok)
      console.error('❌ Error verificando asistencia:', errorCheck);
      throw errorCheck;
    }

    let result;

    if (existente) {
      // Actualizar existente
      const updateData: any = {
        estado: dto.estado,
        modificado_por: userId,
        notas: dto.notas || null,
      };

      // Actualizar timestamps según estado
      if (dto.estado === 'abordo' || dto.estado === 'ausente') {
        updateData.hora_recogida = new Date().toISOString();
        if (dto.latitud && dto.longitud) {
          updateData.ubicacion_recogida = `(${dto.latitud},${dto.longitud})`;
        }
      } else if (dto.estado === 'dejado') {
        updateData.hora_entrega = new Date().toISOString();
        if (dto.latitud && dto.longitud) {
          updateData.ubicacion_entrega = `(${dto.latitud},${dto.longitud})`;
        }
      }

      const { data, error } = await supabase
        .from('asistencias')
        .update(updateData)
        .eq('id', existente.id)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      // Crear nueva
      const insertData: any = {
        id_estudiante: dto.id_estudiante,
        id_chofer: dto.id_chofer,
        id_ruta: dto.id_ruta,
        estado: dto.estado,
        fecha: hoy,
        modificado_por: userId,
        notas: dto.notas || null,
      };

      if (dto.estado === 'abordo' || dto.estado === 'ausente') {
        insertData.hora_recogida = new Date().toISOString();
        if (dto.latitud && dto.longitud) {
          insertData.ubicacion_recogida = `(${dto.latitud},${dto.longitud})`;
        }
      }

      const { data, error } = await supabase
        .from('asistencias')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    console.log(`✅ Asistencia marcada: ${dto.estado} - ${dto.id_estudiante}`);
    return result as Asistencia;
  } catch (error) {
    console.error('❌ Error en marcarAsistencia:', error);
    return null;
  }
}

/**
 * Padre marca a su hijo como ausente
 */
export async function marcarAusente(
  idEstudiante: string,
  idRuta: string,
  notas?: string
): Promise<boolean> {
  try {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) throw new Error('No autenticado');

    const hoy = new Date().toISOString().split('T')[0];

    // Verificar si ya existe
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
          modificado_por: userId,
          notas: notas || 'Marcado ausente por padre',
        })
        .eq('id', existente.id);

      if (error) throw error;
    } else {
      // Crear como ausente (necesita id_chofer dummy)
      const { error } = await supabase
        .from('asistencias')
        .insert({
          id_estudiante: idEstudiante,
          id_chofer: userId, // Temporalmente el padre
          id_ruta: idRuta,
          estado: 'ausente',
          fecha: hoy,
          modificado_por: userId,
          notas: notas || 'Marcado ausente por padre',
        });

      if (error) throw error;
    }

    console.log(`✅ Estudiante marcado como ausente: ${idEstudiante}`);
    return true;
  } catch (error) {
    console.error('❌ Error en marcarAusente:', error);
    return false;
  }
}

/**
 * Obtiene estudiantes de la ruta con su estado de asistencia del día
 */
export async function getEstudiantesConAsistencia(
  idRuta: string,
  idChofer: string
): Promise<EstudianteConAsistencia[]> {
  try {
    console.log(`🔍 Buscando estudiantes para ruta: ${idRuta}, chofer: ${idChofer}`);

    // 1. Obtener IDs de paradas de esta ruta
    const { data: paradasRuta, error: errorParadas } = await supabase
      .from('paradas')
      .select('id')
      .eq('id_ruta', idRuta);

    if (errorParadas) {
      console.error('❌ Error obteniendo paradas:', errorParadas);
      throw errorParadas;
    }

    const paradasIds = (paradasRuta || []).map(p => p.id);
    console.log(`📍 Paradas en ruta: ${paradasIds.length}`);

    if (paradasIds.length === 0) {
      console.log('⚠️ No hay paradas en esta ruta');
      return [];
    }

    // 2. Obtener estudiantes de esas paradas
    const { data: estudiantes, error: errorEstudiantes } = await supabase
      .from('estudiantes')
      .select(`
        id,
        nombre,
        apellido,
        id_parada,
        paradas(
          id,
          nombre,
          orden
        )
      `)
      .in('id_parada', paradasIds)
      .order('apellido', { ascending: true });

    if (errorEstudiantes) {
      console.error('❌ Error obteniendo estudiantes:', errorEstudiantes);
      throw errorEstudiantes;
    }

    console.log(`📊 Estudiantes encontrados: ${estudiantes?.length || 0}`);

    if (!estudiantes || estudiantes.length === 0) {
      return [];
    }

    // 3. Obtener asistencias del día
    const hoy = new Date().toISOString().split('T')[0];
    const estudiantesIds = estudiantes.map((e: any) => e.id);

    const { data: asistencias, error: errorAsistencias } = await supabase
      .from('asistencias')
      .select('*')
      .in('id_estudiante', estudiantesIds)
      .eq('fecha', hoy);

    if (errorAsistencias) {
      console.error('❌ Error obteniendo asistencias:', errorAsistencias);
      throw errorAsistencias;
    }

    // 4. Combinar datos
    const estudiantesConAsistencia: EstudianteConAsistencia[] = estudiantes.map((est: any) => {
      const asistenciaHoy = asistencias?.find(
        (a: any) => a.id_estudiante === est.id
      ) as Asistencia | undefined;

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
        asistenciaHoy: asistenciaHoy || null,
        estado: asistenciaHoy?.estado || 'pendiente',
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
 * Obtiene historial de asistencias de un estudiante
 */
export async function getHistorialAsistencias(
  idEstudiante: string,
  limite: number = 30
): Promise<Asistencia[]> {
  try {
    const { data, error } = await supabase
      .from('asistencias')
      .select('*')
      .eq('id_estudiante', idEstudiante)
      .order('fecha', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limite);

    if (error) {
      console.error('❌ Error obteniendo historial:', error);
      throw error;
    }

    return (data || []) as Asistencia[];
  } catch (error) {
    console.error('❌ Error en getHistorialAsistencias:', error);
    return [];
  }
}
