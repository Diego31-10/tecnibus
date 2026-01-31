import { supabase } from './supabase';

export type AsignacionRuta = {
  id: string;
  id_chofer: string;
  id_ruta: string;
  hora_inicio: string; // TIME format: "06:00:00"
  hora_fin: string; // TIME format: "07:00:00"
  descripcion: string | null;
  dias_semana: string[] | null; // ['lunes', 'martes', ...]
  activo: boolean | null;
  created_at: string | null;
};

export type CreateAsignacionDto = {
  id_chofer: string;
  id_ruta: string;
  hora_inicio: string;
  hora_fin: string;
  descripcion?: string;
  dias_semana?: string[];
};

export type RecorridoChofer = {
  id: string;
  id_ruta: string;
  nombre_ruta: string;
  hora_inicio: string;
  hora_fin: string;
  descripcion: string;
  estado_ruta: string;
};

/**
 * Obtiene los recorridos asignados a un chofer para hoy
 * Usa la función de Supabase que filtra por día de la semana
 */
export async function getRecorridosHoy(idChofer: string): Promise<RecorridoChofer[]> {
  try {
    const { data, error } = await supabase.rpc('get_recorridos_chofer_hoy', {
      p_id_chofer: idChofer,
    });

    if (error) {
      console.error('❌ Error obteniendo recorridos del día:', error);
      throw error;
    }

    return (data || []).map((r) => ({
      id: r.id,
      id_ruta: r.id_ruta,
      nombre_ruta: r.nombre_ruta,
      hora_inicio: r.hora_inicio,
      hora_fin: r.hora_fin,
      descripcion: r.descripcion || '',
      estado_ruta: r.estado_ruta || 'activa',
    }));
  } catch (error) {
    console.error('❌ Error en getRecorridosHoy:', error);
    return [];
  }
}

/**
 * Obtiene todas las asignaciones de un chofer (incluyendo inactivas)
 */
export async function getAsignacionesChofer(idChofer: string): Promise<AsignacionRuta[]> {
  try {
    const { data, error } = await supabase
      .from('asignaciones_ruta')
      .select('*')
      .eq('id_chofer', idChofer)
      .order('hora_inicio', { ascending: true });

    if (error) {
      console.error('❌ Error obteniendo asignaciones del chofer:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('❌ Error en getAsignacionesChofer:', error);
    return [];
  }
}

/**
 * Crea una nueva asignación de recorrido
 * Solo admins pueden hacer esto
 */
export async function createAsignacion(dto: CreateAsignacionDto): Promise<AsignacionRuta | null> {
  try {
    const { data, error } = await supabase
      .from('asignaciones_ruta')
      .insert({
        id_chofer: dto.id_chofer,
        id_ruta: dto.id_ruta,
        hora_inicio: dto.hora_inicio,
        hora_fin: dto.hora_fin,
        descripcion: dto.descripcion || null,
        dias_semana: dto.dias_semana || null,
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error creando asignación:', error);
      throw error;
    }

    console.log('✅ Asignación creada:', data);
    return data as AsignacionRuta;
  } catch (error) {
    console.error('❌ Error en createAsignacion:', error);
    return null;
  }
}

/**
 * Actualiza una asignación existente
 */
export async function updateAsignacion(
  id: string,
  updates: Partial<CreateAsignacionDto>
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('asignaciones_ruta')
      .update(updates)
      .eq('id', id);

    if (error) {
      console.error('❌ Error actualizando asignación:', error);
      throw error;
    }

    console.log('✅ Asignación actualizada:', id);
    return true;
  } catch (error) {
    console.error('❌ Error en updateAsignacion:', error);
    return false;
  }
}

/**
 * Desactiva una asignación (no la elimina, solo cambia activo = false)
 */
export async function desactivarAsignacion(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('asignaciones_ruta')
      .update({ activo: false })
      .eq('id', id);

    if (error) {
      console.error('❌ Error desactivando asignación:', error);
      throw error;
    }

    console.log('✅ Asignación desactivada:', id);
    return true;
  } catch (error) {
    console.error('❌ Error en desactivarAsignacion:', error);
    return false;
  }
}

/**
 * Elimina permanentemente una asignación
 */
export async function deleteAsignacion(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('asignaciones_ruta')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('❌ Error eliminando asignación:', error);
      throw error;
    }

    console.log('✅ Asignación eliminada:', id);
    return true;
  } catch (error) {
    console.error('❌ Error en deleteAsignacion:', error);
    return false;
  }
}

/**
 * Verifica si es hora del recorrido (±30 min)
 */
export async function esHoraRecorrido(idAsignacion: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('es_hora_recorrido', {
      p_id_asignacion: idAsignacion,
    });

    if (error) {
      console.error('❌ Error verificando hora de recorrido:', error);
      return false;
    }

    return data || false;
  } catch (error) {
    console.error('❌ Error en esHoraRecorrido:', error);
    return false;
  }
}

/**
 * Obtiene las asignaciones de una ruta específica
 */
export async function getAsignacionesRuta(idRuta: string): Promise<AsignacionRuta[]> {
  try {
    const { data, error } = await supabase
      .from('asignaciones_ruta')
      .select('*')
      .eq('id_ruta', idRuta)
      .eq('activo', true)
      .order('hora_inicio', { ascending: true });

    if (error) {
      console.error('❌ Error obteniendo asignaciones de la ruta:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('❌ Error en getAsignacionesRuta:', error);
    return [];
  }
}
