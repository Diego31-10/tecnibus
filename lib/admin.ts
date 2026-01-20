import { supabase } from './supabase';

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