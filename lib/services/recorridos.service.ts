import { supabase } from './supabase';

export type EstadoRecorrido = {
  activo: boolean;
  hora_inicio: string | null;
  hora_fin: string | null;
};

export type EstadoRecorridoConAsignacion = EstadoRecorrido & {
  id_asignacion: string | null;
};

/**
 * Iniciar un recorrido (chofer presiona "Iniciar Recorrido")
 */
export async function iniciarRecorrido(idAsignacion: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('iniciar_recorrido', {
      p_id_asignacion: idAsignacion,
    });

    if (error) throw error;

    console.log('✅ Recorrido iniciado:', idAsignacion);
    return data || true;
  } catch (error) {
    console.error('❌ Error iniciando recorrido:', error);
    return false;
  }
}

/**
 * Finalizar un recorrido (chofer presiona "Finalizar Recorrido")
 */
export async function finalizarRecorrido(idAsignacion: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('finalizar_recorrido', {
      p_id_asignacion: idAsignacion,
    });

    if (error) throw error;

    console.log('✅ Recorrido finalizado:', idAsignacion);
    return data || true;
  } catch (error) {
    console.error('❌ Error finalizando recorrido:', error);
    return false;
  }
}

/**
 * Obtener el estado actual de un recorrido
 */
export async function getEstadoRecorrido(
  idAsignacion: string
): Promise<EstadoRecorrido | null> {
  try {
    const { data, error } = await supabase.rpc('get_estado_recorrido', {
      p_id_asignacion: idAsignacion,
    });

    if (error) throw error;

    // La función devuelve un array, tomamos el primer elemento
    const estado = Array.isArray(data) && data.length > 0 ? data[0] : null;

    return estado
      ? {
          activo: estado.activo || false,
          hora_inicio: estado.hora_inicio,
          hora_fin: estado.hora_fin,
        }
      : { activo: false, hora_inicio: null, hora_fin: null };
  } catch (error) {
    console.error('❌ Error obteniendo estado de recorrido:', error);
    return null;
  }
}

/**
 * Obtener el estado de un recorrido por ID de ruta
 * Útil para padres que solo conocen la ruta de su hijo
 */
export async function getEstadoRecorridoPorRuta(
  idRuta: string
): Promise<EstadoRecorridoConAsignacion | null> {
  try {
    const { data, error } = await supabase.rpc('get_estado_recorrido_por_ruta', {
      p_id_ruta: idRuta,
    });

    if (error) throw error;

    // La función devuelve un array, tomamos el primer elemento
    const estado = Array.isArray(data) && data.length > 0 ? data[0] : null;

    return estado
      ? {
          activo: estado.activo || false,
          hora_inicio: estado.hora_inicio,
          hora_fin: estado.hora_fin,
          id_asignacion: estado.id_asignacion,
        }
      : { activo: false, hora_inicio: null, hora_fin: null, id_asignacion: null };
  } catch (error) {
    console.error('❌ Error obteniendo estado de recorrido por ruta:', error);
    return null;
  }
}
