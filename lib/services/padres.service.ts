import { supabase } from './supabase';

export type EstudianteDelPadre = {
  id: string;
  nombre: string;
  apellido: string;
  nombreCompleto: string;
  id_parada: string | null;
  parada?: {
    id: string;
    nombre: string | null;
    ruta?: {
      id: string;
      nombre: string;
    };
  };
};

/**
 * Obtiene los estudiantes del padre autenticado
 * Solo retorna estudiantes donde id_padre = auth.uid()
 */
export async function getMyEstudiantes(): Promise<EstudianteDelPadre[]> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      console.error('❌ No hay usuario autenticado');
      return [];
    }

    // Obtener estudiantes (sin JOIN con paradas por RLS)
    const { data, error } = await supabase
      .from('estudiantes')
      .select('id, nombre, apellido, id_parada')
      .eq('id_padre', user.id)
      .order('nombre', { ascending: true });

    if (error) {
      console.error('❌ Error obteniendo mis estudiantes:', error);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Obtener paradas y rutas por separado (solo si es admin o usar otra estrategia)
    // Por ahora, retornar solo info básica del estudiante
    return data.map((est) => ({
      id: est.id,
      nombre: est.nombre,
      apellido: est.apellido,
      nombreCompleto: `${est.nombre} ${est.apellido}`,
      id_parada: est.id_parada,
      parada: undefined, // Los padres no tienen acceso directo a paradas por RLS
    }));
  } catch (error) {
    console.error('❌ Error en getMyEstudiantes:', error);
    return [];
  }
}
