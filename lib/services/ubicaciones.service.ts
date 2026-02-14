import { supabase } from './supabase';

export type UbicacionBus = {
  id: string;
  id_asignacion: string;
  id_chofer: string;
  latitud: number;
  longitud: number;
  velocidad: number | null;
  precision_gps: number | null;
  heading: number | null;
  ubicacion_timestamp: string;
};

export type UbicacionActual = {
  latitud: number;
  longitud: number;
  velocidad: number | null;
  precision_gps: number | null;
  heading: number | null;
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
  precisionGps?: number,
  heading?: number
): Promise<boolean> {
  try {
    console.log('💾 Intentando guardar ubicación:', {
      idAsignacion,
      idChofer,
      lat: latitud.toFixed(6),
      lng: longitud.toFixed(6),
      velocidad: velocidad ? `${velocidad.toFixed(1)} km/h` : 'null',
    });

    // Usar RPC con SECURITY DEFINER para bypassear RLS
    const { data, error } = await supabase.rpc('guardar_ubicacion_chofer', {
      p_id_asignacion: idAsignacion,
      p_id_chofer: idChofer,
      p_latitud: latitud,
      p_longitud: longitud,
      p_velocidad: velocidad || null,
      p_precision_gps: precisionGps || null,
      p_heading: heading || null,
    });

    if (error) {
      console.error('❌ Error guardando ubicación:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });
      return false;
    }

    console.log('✅ Ubicación guardada exitosamente, ID:', data);
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
          heading: newRow.heading,
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
