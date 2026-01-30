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
  paradas?: Parada[];
};

export type CreateRutaDto = {
  nombre: string;
  hora_inicio: string | null;
  hora_fin: string | null;
  estado?: string | null;
};

export type UpdateRutaDto = Partial<CreateRutaDto>;

export type CreateParadaDto = {
  id_ruta: string;
  nombre: string;
  direccion: string;
  latitud: number;
  longitud: number;
  hora_aprox: string | null;
  orden: number;
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
        estado
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
    // Verificar si hay estudiantes asignados
    const { data: estudiantes, error: estudiantesError } = await supabase
      .from('estudiantes')
      .select('id')
      .eq('id_ruta', id)
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
