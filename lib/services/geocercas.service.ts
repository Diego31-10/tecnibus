import { supabase } from './supabase';

export type EstadoGeocerca = 'pendiente' | 'en_zona' | 'completado' | 'omitido';

export type EstudianteGeocerca = {
  id_estudiante: string;
  nombre: string;
  apellido: string;
  nombreCompleto: string;
  id_parada: string;
  parada_nombre: string | null;
  parada_latitud: number;
  parada_longitud: number;
  orden_parada: number;
  estado: EstadoGeocerca;
};

/**
 * Inicializar estados de geocercas al iniciar recorrido
 */
export async function inicializarEstadosGeocercas(
  idRecorrido: string,
  idChofer: string
): Promise<boolean> {
  try {
    console.log('🔄 Inicializando estados de geocercas...', { idRecorrido, idChofer });

    const { error } = await supabase.rpc('inicializar_estados_geocercas', {
      p_id_recorrido: idRecorrido,
      p_id_chofer: idChofer,
    });

    if (error) {
      console.error('❌ Error inicializando estados:', error);
      return false;
    }

    console.log('✅ Estados de geocercas inicializados');
    return true;
  } catch (error) {
    console.error('❌ Error en inicializarEstadosGeocercas:', error);
    return false;
  }
}

/**
 * Marcar entrada a geocerca (notifica al padre)
 */
export async function marcarEntradaGeocerca(
  idRecorrido: string,
  idEstudiante: string,
  idChofer: string
): Promise<{
  success: boolean;
  estudiante?: {
    id_estudiante: string;
    nombre: string;
    apellido: string;
    parada: string;
  };
}> {
  try {
    console.log('📍 Entrada a geocerca:', { idRecorrido, idEstudiante });

    const { data, error } = await supabase.rpc('entrada_geocerca', {
      p_id_recorrido: idRecorrido,
      p_id_estudiante: idEstudiante,
      p_id_chofer: idChofer,
    });

    if (error) {
      console.error('❌ Error en entrada_geocerca:', error);
      return { success: false };
    }

    console.log('✅ Entrada registrada, notificación enviada al padre');
    return { success: true, estudiante: data };
  } catch (error) {
    console.error('❌ Error en marcarEntradaGeocerca:', error);
    return { success: false };
  }
}

/**
 * Marcar salida de geocerca (auto-presente si no marcó ausente)
 */
export async function marcarSalidaGeocerca(
  idRecorrido: string,
  idEstudiante: string,
  idChofer: string
): Promise<boolean> {
  try {
    console.log('🚶 Salida de geocerca:', { idRecorrido, idEstudiante });

    const { error } = await supabase.rpc('salida_geocerca', {
      p_id_recorrido: idRecorrido,
      p_id_estudiante: idEstudiante,
      p_id_chofer: idChofer,
    });

    if (error) {
      console.error('❌ Error en salida_geocerca:', error);
      return false;
    }

    console.log('✅ Salida registrada, asistencia marcada automáticamente como presente');
    return true;
  } catch (error) {
    console.error('❌ Error en marcarSalidaGeocerca:', error);
    return false;
  }
}

/**
 * Marcar estudiante como completado (cuando el chofer marca ausente manualmente)
 */
export async function marcarEstudianteCompletado(
  idRecorrido: string,
  idEstudiante: string,
  idChofer: string,
  estadoAsistencia: 'presente' | 'ausente'
): Promise<boolean> {
  try {
    console.log('✅ Marcando estudiante como completado:', {
      idEstudiante,
      estadoAsistencia,
    });

    const { error } = await supabase.rpc('marcar_estudiante_completado', {
      p_id_recorrido: idRecorrido,
      p_id_estudiante: idEstudiante,
      p_id_chofer: idChofer,
      p_estado_asistencia: estadoAsistencia,
    });

    if (error) {
      console.error('❌ Error en marcar_estudiante_completado:', error);
      return false;
    }

    console.log('✅ Estudiante marcado como completado');
    return true;
  } catch (error) {
    console.error('❌ Error en marcarEstudianteCompletado:', error);
    return false;
  }
}

/**
 * Obtener el siguiente estudiante pendiente o en zona
 */
export async function getSiguienteEstudianteGeocerca(
  idRecorrido: string
): Promise<EstudianteGeocerca | null> {
  try {
    const { data, error } = await supabase.rpc('get_siguiente_estudiante_geocerca', {
      p_id_recorrido: idRecorrido,
    });

    if (error) {
      console.error('❌ Error obteniendo siguiente estudiante:', error);
      return null;
    }

    if (!data || data.length === 0) {
      console.log('ℹ️ No hay más estudiantes pendientes');
      return null;
    }

    const estudiante = data[0];
    return {
      ...estudiante,
      nombreCompleto: `${estudiante.nombre} ${estudiante.apellido}`,
    };
  } catch (error) {
    console.error('❌ Error en getSiguienteEstudianteGeocerca:', error);
    return null;
  }
}

/**
 * Calcular distancia entre dos coordenadas (en metros)
 * Fórmula de Haversine
 */
export function calcularDistancia(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Radio de la Tierra en metros
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distancia en metros
}

/**
 * Verificar si está dentro del radio de geocerca
 */
export function estaDentroDeGeocerca(
  latitudBus: number,
  longitudBus: number,
  latitudParada: number,
  longitudParada: number,
  radioMetros: number = 100
): boolean {
  const distancia = calcularDistancia(
    latitudBus,
    longitudBus,
    latitudParada,
    longitudParada
  );

  return distancia <= radioMetros;
}
