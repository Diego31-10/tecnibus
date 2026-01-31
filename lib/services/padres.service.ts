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

    const { data, error } = await supabase
      .from('estudiantes')
      .select(
        `
        id,
        nombre,
        apellido,
        id_parada,
        paradas(
          id,
          nombre,
          rutas(
            id,
            nombre
          )
        )
      `
      )
      .eq('id_padre', user.id)
      .order('nombre', { ascending: true });

    if (error) {
      console.error('❌ Error obteniendo mis estudiantes:', error);
      return [];
    }

    // Mapear a formato esperado
    return (data || []).map((est: any) => ({
      id: est.id,
      nombre: est.nombre,
      apellido: est.apellido,
      nombreCompleto: `${est.nombre} ${est.apellido}`,
      id_parada: est.id_parada,
      parada: est.paradas
        ? {
            id: est.paradas.id,
            nombre: est.paradas.nombre,
            ruta: est.paradas.rutas
              ? {
                  id: est.paradas.rutas.id,
                  nombre: est.paradas.rutas.nombre,
                }
              : undefined,
          }
        : undefined,
    }));
  } catch (error) {
    console.error('❌ Error en getMyEstudiantes:', error);
    return [];
  }
}
