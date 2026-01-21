import { supabase } from './supabase';
import type { Profile } from './useProfile';


type CrearUsuarioParams = {
  nombre: string;
  email: string;
  password: string;
  rol: 'chofer' | 'padre';
};

type CrearUsuarioResponse = {
  success: boolean;
  user?: {
    id: string;
    email: string;
    nombre: string;
    rol: string;
  };
  error?: string;
};

type EliminarResponse = {
  success: boolean;
  error?: string;
};

/**
 * Llama a la Edge Function para crear un usuario (chofer o padre)
 * Solo debe ser llamado por usuarios con rol 'admin'
 */
export async function crearUsuario(params: CrearUsuarioParams): Promise<CrearUsuarioResponse> {
  try {
    const { data, error } = await supabase.functions.invoke('crear-usuario', {
      body: params,
    });

    if (error) {
      console.error('❌ Error invocando función:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    if (data.error) {
      console.error('❌ Error en respuesta:', data.error);
      return {
        success: false,
        error: data.error,
      };
    }

    console.log('✅ Usuario creado exitosamente:', data.user);
    return data;

  } catch (error) {
    console.error('❌ Error general:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

/**
 * Obtiene la lista de todos los choferes registrados
 * Solo debe ser llamado por usuarios con rol 'admin'
 */
export async function obtenerChoferes(): Promise<Profile[]> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('rol', 'chofer')
      .order('created_at', { ascending: false });
      console.log('👤 Usuario actual:', (await supabase.auth.getUser()).data.user?.email);
      console.log('📦 Choferes recibidos:', data);

    if (error) {
      console.error('❌ Error obteniendo choferes:', error);
      throw error;
    }

    console.log(`✅ ${data?.length || 0} choferes cargados`);
    return data || [];

  } catch (error) {
    console.error('❌ Error general obteniendo choferes:', error);
    throw error;
  }
}

/**
 * Obtiene la lista de todos los padres registrados
 * Solo debe ser llamado por usuarios con rol 'admin'
 */
export async function obtenerPadres(): Promise<Profile[]> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('rol', 'padre')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error obteniendo padres:', error);
      throw error;
    }

    console.log(`✅ ${data?.length || 0} padres cargados`);
    return data || [];

  } catch (error) {
    console.error('❌ Error general obteniendo padres:', error);
    throw error;
  }
}
// Elimina un padre del sistema (Perfil + Auth)
export async function eliminarChofer(choferId: string): Promise<EliminarResponse> {
  try {
    const { data, error } = await supabase.functions.invoke('eliminar-usuario', {
      body: { userId: choferId },
    });

    // Si hay un error de red o de la función
    if (error) {
      // Intentar extraer el mensaje de error del cuerpo si existe
      const errorMsg = error instanceof Error ? error.message : 'Error en servidor';
      return { success: false, error: errorMsg };
    }

    // Si la función respondió pero con éxito: false
    if (data && data.success === false) {
      return { success: false, error: data.error };
    }

    return { success: true };

  } catch (error) {
    console.error('❌ Error general:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error inesperado',
    };
  }
}
/**
 * Elimina un padre del sistema (Perfil + Auth)
 * Utiliza la misma Edge Function que eliminarChofer
 */
export async function eliminarPadre(padreId: string): Promise<EliminarResponse> {
  try {
    const { data, error } = await supabase.functions.invoke('eliminar-usuario', {
      body: { userId: padreId },
    });

    // Manejo de errores de la invocación (red, timeout, etc.)
    if (error) {
      console.error('❌ Error invocando función para eliminar padre:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    // Manejo de error devuelto por la lógica de la función
    if (data && data.success === false) {
      console.error('❌ Error en respuesta de eliminación:', data.error);
      return {
        success: false,
        error: data.error,
      };
    }

    console.log('✅ Padre eliminado exitosamente');
    return {
      success: true,
    };

  } catch (error) {
    console.error('❌ Error general eliminando padre:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}