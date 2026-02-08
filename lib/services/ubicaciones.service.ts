import { supabase } from './supabase';

export type UbicacionBus = {
  id: string;
  id_asignacion: string;
  id_chofer: string;
  latitud: number;
  longitud: number;
  velocidad: number | null;
  precision_gps: number | null;
  ubicacion_timestamp: string;
};

export type UbicacionActual = {
  latitud: number;
  longitud: number;
  velocidad: number | null;
  precision_gps: number | null;
  ubicacion_timestamp: string;
};

/**
 * Guardar ubicación del bus (llamado desde app del chofer cada 10s)
 */
export async function guardarUbicacion(
  idAsignacion: string,
  idChofer: string,
  latitud: number,
  longitud: number,
  velocidad?: number,
  precisionGps?: number
): Promise<boolean> {
  try {
    const { error } = await supabase.from('ubicaciones_bus').insert({
      id_asignacion: idAsignacion,
      id_chofer: idChofer,
      latitud,
      longitud,
      velocidad: velocidad || null,
      precision_gps: precisionGps || null,
    });

    if (error) {
      console.error('❌ Error guardando ubicación:', error);
      return false;
    }
    return true;
  } catch (error) {
    console.error('❌ Error en guardarUbicacion:', error);
    return false;
  }
}

/**
 * Obtener última ubicación del bus (llamado desde app del padre)
 */
export async function getUltimaUbicacion(
  idAsignacion: string
): Promise<UbicacionActual | null> {
  try {
    const { data, error } = await supabase.rpc('get_ultima_ubicacion_bus', {
      p_id_asignacion: idAsignacion,
    });

    if (error) {
      console.error('❌ Error obteniendo última ubicación:', error);
      return null;
    }

    const ubicacion = Array.isArray(data) && data.length > 0 ? data[0] : null;
    return ubicacion || null;
  } catch (error) {
    console.error('❌ Error en getUltimaUbicacion:', error);
    return null;
  }
}

/**
 * Suscribirse a cambios de ubicación en tiempo real
 * Retorna función de cleanup para desuscribirse
 */
export function suscribirseAUbicaciones(
  idAsignacion: string,
  callback: (ubicacion: UbicacionActual) => void
): () => void {
  const channel = supabase
    .channel(`ubicaciones-${idAsignacion}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'ubicaciones_bus',
        filter: `id_asignacion=eq.${idAsignacion}`,
      },
      (payload) => {
        console.log('📍 Nueva ubicación recibida:', payload);
        const newRow = payload.new as any;
        callback({
          latitud: newRow.latitud,
          longitud: newRow.longitud,
          velocidad: newRow.velocidad,
          precision_gps: newRow.precision_gps,
          ubicacion_timestamp: newRow.ubicacion_timestamp,
        });
      }
    )
    .subscribe((status) => {
      console.log('📡 Estado suscripción ubicaciones:', status);
    });

  // Retornar función de cleanup
  return () => {
    console.log('🔕 Desuscribiendo de ubicaciones');
    supabase.removeChannel(channel);
  };
}
