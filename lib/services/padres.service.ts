import { supabase } from './supabase';

export type EstudianteDelPadre = {
  id: string;
  nombre: string;
  apellido: string;
  nombreCompleto: string;
  id_ruta: string | null;
  ruta?: {
    id: string;
    nombre: string;
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
        id_ruta,
        rutas(
          id,
          nombre
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
      id_ruta: est.id_ruta,
      ruta: est.rutas
        ? {
            id: est.rutas.id,
            nombre: est.rutas.nombre,
          }
        : undefined,
    }));
  } catch (error) {
    console.error('❌ Error en getMyEstudiantes:', error);
    return [];
  }
}
