import { supabase } from './supabase';

export type UbicacionColegio = {
  latitud: number;
  longitud: number;
  nombre: string;
};

/**
 * Obtiene la ubicación del colegio configurada
 */
export async function getUbicacionColegio(): Promise<UbicacionColegio> {
  try {
    const { data, error } = await supabase
      .from('configuracion')
      .select('valor')
      .eq('clave', 'ubicacion_colegio')
      .single();

    if (error || !data) {
      console.warn('⚠️ No se encontró configuración del colegio, usando default');
      console.warn('Error:', error);
      return {
        latitud: -2.9, // Cuenca, Ecuador
        longitud: -79.0,
        nombre: 'Colegio TecniBus',
      };
    }

    console.log('✅ Ubicación del colegio obtenida:', data.valor);
    return data.valor as UbicacionColegio;
  } catch (error) {
    console.error('❌ Error obteniendo ubicación del colegio:', error);
    return {
      latitud: -2.9,
      longitud: -79.0,
      nombre: 'Colegio TecniBus',
    };
  }
}

/**
 * Actualiza la ubicación del colegio (UPSERT)
 * Solo admins pueden hacer esto
 */
export async function updateUbicacionColegio(
  ubicacion: UbicacionColegio
): Promise<boolean> {
  try {
    // Usar upsert para crear o actualizar
    const { error } = await supabase
      .from('configuracion')
      .upsert({
        clave: 'ubicacion_colegio',
        valor: ubicacion,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'clave', // Si existe la clave, actualizar
      });

    if (error) {
      console.error('❌ Error guardando ubicación del colegio:', error);
      return false;
    }

    console.log('✅ Ubicación del colegio guardada:', ubicacion);
    return true;
  } catch (error) {
    console.error('❌ Error en updateUbicacionColegio:', error);
    return false;
  }
}
