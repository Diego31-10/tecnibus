import { supabase } from './supabase';

export type Parada = {
  id: string;
  id_ruta: string | null;
  nombre: string | null;
  direccion: string | null;
  latitud: number;
  longitud: number;
  hora_aprox: string | null;
  orden: number | null;
};

export type Ruta = {
  id: string;
  nombre: string;
  hora_inicio: string | null;
  hora_fin: string | null;
  estado: string | null;
  tipo: 'ida' | 'vuelta';
  paradas?: Parada[];
};

export type CreateRutaDto = {
  nombre: string;
  hora_inicio: string | null;
  hora_fin: string | null;
  estado?: string | null;
  tipo: 'ida' | 'vuelta';
};

export type UpdateRutaDto = Partial<CreateRutaDto>;

export type CreateParadaDto = {
  id_ruta: string;
  nombre: string;
  direccion: string;
  latitud: number;
  longitud: number;
  hora_aprox: string | null;
  orden?: number; // Opcional - usado solo para visualización, no afecta la optimización
};

export type UpdateParadaDto = Partial<Omit<CreateParadaDto, 'id_ruta'>>;

/**
 * Obtiene todas las rutas con sus paradas
 */
export async function getRutas(): Promise<Ruta[]> {
  try {
    const { data, error } = await supabase
      .from('rutas')
      .select(`
        id,
        nombre,
        hora_inicio,
        hora_fin,
        estado,
        tipo,
        paradas(
          id,
          nombre,
          direccion,
          latitud,
          longitud,
          hora_aprox,
          orden
        )
      `)
      .order('nombre', { ascending: true });

    if (error) {
      console.error('❌ Error obteniendo rutas:', error);
      throw error;
    }

    console.log(`✅ ${data?.length || 0} rutas obtenidas`);
    return data || [];
  } catch (error) {
    console.error('❌ Error en getRutas:', error);
    return [];
  }
}

/**
 * Obtiene una ruta específica con sus paradas ordenadas
 */
export async function getRutaById(id: string): Promise<Ruta | null> {
  try {
    const { data, error } = await supabase
      .from('rutas')
      .select(`
        id,
        nombre,
        hora_inicio,
        hora_fin,
        estado,
        tipo
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('❌ Error obteniendo ruta:', error);
      throw error;
    }

    // Obtener paradas ordenadas
    const paradas = await getParadasByRuta(id);

    return {
      ...data,
      paradas,
    };
  } catch (error) {
    console.error('❌ Error en getRutaById:', error);
    return null;
  }
}

/**
 * Crea una nueva ruta
 */
export async function createRuta(dto: CreateRutaDto): Promise<Ruta | null> {
  try {
    const { data, error } = await supabase
      .from('rutas')
      .insert({
        nombre: dto.nombre.trim(),
        hora_inicio: dto.hora_inicio,
        hora_fin: dto.hora_fin,
        estado: dto.estado || 'activa',
      })
      .select('id, nombre, hora_inicio, hora_fin, estado')
      .single();

    if (error) {
      console.error('❌ Error creando ruta:', error);
      throw error;
    }

    console.log('✅ Ruta creada:', data);
    return data;
  } catch (error) {
    console.error('❌ Error en createRuta:', error);
    return null;
  }
}

/**
 * Actualiza una ruta existente
 */
export async function updateRuta(
  id: string,
  dto: UpdateRutaDto
): Promise<boolean> {
  try {
    const updateData: any = {};

    if (dto.nombre !== undefined) updateData.nombre = dto.nombre.trim();
    if (dto.hora_inicio !== undefined) updateData.hora_inicio = dto.hora_inicio;
    if (dto.hora_fin !== undefined) updateData.hora_fin = dto.hora_fin;
    if (dto.estado !== undefined) updateData.estado = dto.estado;

    const { error } = await supabase
      .from('rutas')
      .update(updateData)
      .eq('id', id);

    if (error) {
      console.error('❌ Error actualizando ruta:', error);
      throw error;
    }

    console.log('✅ Ruta actualizada:', id);
    return true;
  } catch (error) {
    console.error('❌ Error en updateRuta:', error);
    return false;
  }
}

/**
 * Elimina una ruta
 * Verifica que no haya estudiantes asignados antes de eliminar
 */
export async function deleteRuta(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Verificar si hay estudiantes asignados a paradas de esta ruta
    const { data: paradas, error: paradasError } = await supabase
      .from('paradas')
      .select('id')
      .eq('id_ruta', id);

    if (paradasError) {
      console.error('❌ Error obteniendo paradas:', paradasError);
      throw paradasError;
    }

    if (paradas && paradas.length > 0) {
      const paradaIds = paradas.map(p => p.id);

      const { data: estudiantes, error: estudiantesError } = await supabase
        .from('estudiantes')
        .select('id')
        .in('id_parada', paradaIds)
        .limit(1);

      if (estudiantesError) {
        console.error('❌ Error verificando estudiantes:', estudiantesError);
        throw estudiantesError;
      }

      if (estudiantes && estudiantes.length > 0) {
        return {
          success: false,
          error: 'No se puede eliminar la ruta porque tiene estudiantes asignados',
        };
      }
    }

    // Si no hay estudiantes, proceder con la eliminación (cascada borrará paradas)
    const { error } = await supabase
      .from('rutas')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('❌ Error eliminando ruta:', error);
      throw error;
    }

    console.log('✅ Ruta eliminada:', id);
    return { success: true };
  } catch (error) {
    console.error('❌ Error en deleteRuta:', error);
    return { success: false, error: 'Error al eliminar la ruta' };
  }
}

/**
 * Obtiene las paradas de una ruta específica
 */
export async function getParadasByRuta(id_ruta: string): Promise<Parada[]> {
  try {
    const { data, error } = await supabase
      .from('paradas')
      .select('id, id_ruta, nombre, direccion, latitud, longitud, hora_aprox, orden')
      .eq('id_ruta', id_ruta)
      .order('orden', { ascending: true });

    if (error) {
      console.error('❌ Error obteniendo paradas:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('❌ Error en getParadasByRuta:', error);
    return [];
  }
}

/**
 * Crea una nueva parada
 */
export async function createParada(dto: CreateParadaDto): Promise<Parada | null> {
  try {
    const { data, error } = await supabase
      .from('paradas')
      .insert({
        id_ruta: dto.id_ruta,
        nombre: dto.nombre.trim(),
        direccion: dto.direccion.trim(),
        latitud: dto.latitud,
        longitud: dto.longitud,
        hora_aprox: dto.hora_aprox,
        orden: dto.orden,
      })
      .select('id, id_ruta, nombre, direccion, latitud, longitud, hora_aprox, orden')
      .single();

    if (error) {
      console.error('❌ Error creando parada:', error);
      throw error;
    }

    console.log('✅ Parada creada:', data);
    return data;
  } catch (error) {
    console.error('❌ Error en createParada:', error);
    return null;
  }
}

/**
 * Actualiza una parada existente
 */
export async function updateParada(
  id: string,
  dto: UpdateParadaDto
): Promise<boolean> {
  try {
    const updateData: any = {};

    if (dto.nombre !== undefined) updateData.nombre = dto.nombre.trim();
    if (dto.direccion !== undefined) updateData.direccion = dto.direccion.trim();
    if (dto.latitud !== undefined) updateData.latitud = dto.latitud;
    if (dto.longitud !== undefined) updateData.longitud = dto.longitud;
    if (dto.hora_aprox !== undefined) updateData.hora_aprox = dto.hora_aprox;
    if (dto.orden !== undefined) updateData.orden = dto.orden;

    const { error } = await supabase
      .from('paradas')
      .update(updateData)
      .eq('id', id);

    if (error) {
      console.error('❌ Error actualizando parada:', error);
      throw error;
    }

    console.log('✅ Parada actualizada:', id);
    return true;
  } catch (error) {
    console.error('❌ Error en updateParada:', error);
    return false;
  }
}

/**
 * Elimina una parada
 */
export async function deleteParada(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('paradas')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('❌ Error eliminando parada:', error);
      throw error;
    }

    console.log('✅ Parada eliminada:', id);
    return true;
  } catch (error) {
    console.error('❌ Error en deleteParada:', error);
    return false;
  }
}

/**
 * Obtiene busetas disponibles para asignación
 */
export async function getBusetasDisponibles(): Promise<Array<{
  id: string;
  placa: string;
  capacidad: number;
}>> {
  try {
    const { data, error } = await supabase
      .from('busetas')
      .select('id, placa, capacidad')
      .order('placa', { ascending: true });

    if (error) {
      console.error('❌ Error obteniendo busetas:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('❌ Error en getBusetasDisponibles:', error);
    return [];
  }
}

/**
 * Calcula la ruta optimizada para el chofer
 * @param ubicacionChofer - Ubicación actual del chofer
 * @param paradas - Paradas de la ruta (sin orden)
 * @param tipoRuta - Tipo de ruta ("ida" o "vuelta")
 * @param ubicacionColegio - Ubicación del colegio
 * @returns Paradas reordenadas según optimización de Google
 */
export async function calcularRutaOptimizada(
  ubicacionChofer: { lat: number; lng: number },
  paradas: Parada[],
  tipoRuta: 'ida' | 'vuelta',
  ubicacionColegio: { lat: number; lng: number },
): Promise<{
  paradasOptimizadas: Parada[];
  distanciaTotal: number;
  duracionTotal: number;
  polylineCoordinates: { latitude: number; longitude: number }[];
} | null> {
  try {
    const { getOptimizedRouteForDriver } = await import('./directions.service');

    if (paradas.length === 0) {
      console.warn('⚠️ No hay paradas para optimizar');
      return null;
    }

    console.log('🗺️ Calculando ruta optimizada:', {
      ubicacionChofer,
      numParadas: paradas.length,
      tipoRuta,
      ubicacionColegio,
    });

    // Convertir paradas a coordenadas
    const stops = paradas.map(p => ({ lat: p.latitud, lng: p.longitud }));

    // Lógica diferente según tipo de ruta:
    let origen: { lat: number; lng: number };
    let destino: { lat: number; lng: number };
    let waypointsIntermedios: { lat: number; lng: number }[];

    if (tipoRuta === 'ida') {
      // RUTA IDA: Chofer → Paradas → Colegio
      origen = ubicacionChofer;
      waypointsIntermedios = stops;
      destino = ubicacionColegio;
    } else {
      // RUTA VUELTA: Colegio → Paradas → Última parada más lejana
      origen = ubicacionColegio;
      waypointsIntermedios = stops.slice(0, -1); // Todas menos la última
      destino = stops[stops.length - 1]; // Última parada
    }

    console.log('📍 Configuración ruta:', {
      tipo: tipoRuta,
      origen: `${origen.lat.toFixed(4)}, ${origen.lng.toFixed(4)}`,
      waypoints: waypointsIntermedios.length,
      destino: `${destino.lat.toFixed(4)}, ${destino.lng.toFixed(4)}`,
    });

    // Llamar a Google Directions API con optimize:true
    const result = await getOptimizedRouteForDriver(
      origen,
      waypointsIntermedios,
      destino,
    );

    if (!result || !result.waypointOrder) {
      console.warn('⚠️ No se pudo optimizar, usando orden original de paradas');
      // Retornar paradas en orden original si no se puede optimizar
      return {
        paradasOptimizadas: paradas,
        distanciaTotal: 0,
        duracionTotal: 0,
        polylineCoordinates: [],
      };
    }

    // Reordenar paradas según waypoint_order de Google
    const paradasOptimizadas = result.waypointOrder.map(index => paradas[index]);

    console.log('✅ Ruta optimizada calculada:', {
      paradasOriginales: paradas.length,
      paradasOptimizadas: paradasOptimizadas.length,
      distancia: result.distance,
      duracion: result.duration,
      polylinePoints: result.decodedCoordinates.length,
    });

    return {
      paradasOptimizadas,
      distanciaTotal: result.distance,
      duracionTotal: result.duration,
      polylineCoordinates: result.decodedCoordinates,
    };
  } catch (error) {
    console.error('❌ Error calculando ruta optimizada:', error);
    // Retornar paradas en orden original en caso de error
    return {
      paradasOptimizadas: paradas,
      distanciaTotal: 0,
      duracionTotal: 0,
      polylineCoordinates: [],
    };
  }
}
