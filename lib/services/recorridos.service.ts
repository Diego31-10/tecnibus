import { supabase } from './supabase';
import { sendPushToParents } from './notifications.service';

export type EstadoRecorrido = {
  activo: boolean;
  hora_inicio: string | null;
  hora_fin: string | null;
};

export type EstadoRecorridoConAsignacion = EstadoRecorrido & {
  id_asignacion: string | null;
};

async function sendBroadcast(event: string, payload: Record<string, unknown>): Promise<void> {
  const channel = supabase.channel('recorrido-status');
  await channel.httpSend(event, payload);
}

/**
 * Guardar el polyline calculado en la asignación
 */
export async function guardarPolylineRuta(
  idAsignacion: string,
  polylineCoordinates: { latitude: number; longitude: number }[]
): Promise<boolean> {
  try {
    console.log('💾 guardarPolylineRuta - Iniciando:', {
      idAsignacion,
      cantidadPuntos: polylineCoordinates.length,
    });

    const { data, error } = await supabase
      .from('asignaciones_ruta')
      .update({ polyline_coordinates: polylineCoordinates })
      .eq('id', idAsignacion)
      .select();

    console.log('💾 guardarPolylineRuta - Respuesta:', { data, error });

    if (error) {
      console.error('❌ Error guardando polyline:', error);
      return false;
    }

    console.log('✅ Polyline guardado para asignación:', idAsignacion);
    return true;
  } catch (error) {
    console.error('❌ Error en guardarPolylineRuta:', error);
    return false;
  }
}

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

    // Notificar via broadcast para actualización instantánea
    await sendBroadcast('recorrido_iniciado', { id_asignacion: idAsignacion, activo: true });

    // Enviar notificación push a los padres de la ruta
    sendPushToParents(
      idAsignacion,
      'Buseta en camino',
      'La buseta ha iniciado el recorrido. Puedes seguirla en tiempo real.',
      { id_asignacion: idAsignacion, tipo: 'recorrido_iniciado' }
    ).catch((err) => {
      // No bloquear el flujo si falla la notificación
      console.warn('Error enviando notificación push:', err);
    });

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

    // Notificar via broadcast para actualización instantánea
    await sendBroadcast('recorrido_finalizado', { id_asignacion: idAsignacion, activo: false });

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
    console.log('🔍 getEstadoRecorridoPorRuta - ID Ruta:', idRuta);

    const { data, error } = await supabase.rpc('get_estado_recorrido_por_ruta', {
      p_id_ruta: idRuta,
    });

    console.log('📡 RPC Response - Data:', data, 'Error:', error);

    if (error) throw error;

    // La función devuelve un array, tomamos el primer elemento
    const estado = Array.isArray(data) && data.length > 0 ? data[0] : null;

    console.log('📊 Estado procesado:', estado);

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
