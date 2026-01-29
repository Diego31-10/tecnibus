import { supabase } from './supabase';

export type UpdateProfileParams = {
  nombre: string;
  apellido: string;
  telefono: string;
};

export type UpdateProfileResponse = {
  success: boolean;
  error?: string;
};

/**
 * Actualiza el perfil del usuario autenticado
 * Solo permite actualizar: nombre, apellido, telefono
 * El correo y rol no son editables
 */
export async function updateProfile(
  params: UpdateProfileParams
): Promise<UpdateProfileResponse> {
  try {
    // Obtener usuario autenticado
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('❌ Error obteniendo usuario:', authError);
      return {
        success: false,
        error: 'No hay sesión activa',
      };
    }

    // Validaciones básicas
    if (!params.nombre.trim()) {
      return {
        success: false,
        error: 'El nombre es obligatorio',
      };
    }

    if (!params.apellido.trim()) {
      return {
        success: false,
        error: 'El apellido es obligatorio',
      };
    }

    // Actualizar perfil (RLS permite solo actualizar el propio perfil)
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        nombre: params.nombre.trim(),
        apellido: params.apellido.trim(),
        telefono: params.telefono.trim() || null,
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('❌ Error actualizando perfil:', updateError);
      return {
        success: false,
        error: updateError.message || 'Error al actualizar el perfil',
      };
    }

    console.log('✅ Perfil actualizado con éxito');
    return { success: true };
  } catch (err) {
    console.error('❌ Error inesperado:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error inesperado',
    };
  }
}
