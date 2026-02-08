import * as ImagePicker from 'expo-image-picker';
import { supabase } from './supabase';

const BUCKET_NAME = 'avatares';

/**
 * Solicitar permisos de galería
 */
export async function requestMediaLibraryPermissions(): Promise<boolean> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    console.error('❌ Permiso de galería denegado');
    return false;
  }
  return true;
}

/**
 * Solicitar permisos de cámara
 */
export async function requestCameraPermissions(): Promise<boolean> {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== 'granted') {
    console.error('❌ Permiso de cámara denegado');
    return false;
  }
  return true;
}

/**
 * Seleccionar imagen desde galería
 */
export async function pickImageFromGallery(): Promise<string | null> {
  const hasPermission = await requestMediaLibraryPermissions();
  if (!hasPermission) return null;

  try {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled) {
      return null;
    }

    return result.assets[0].uri;
  } catch (error) {
    console.error('❌ Error seleccionando imagen:', error);
    return null;
  }
}

/**
 * Tomar foto con cámara
 */
export async function takePhotoWithCamera(): Promise<string | null> {
  const hasPermission = await requestCameraPermissions();
  if (!hasPermission) return null;

  try {
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled) {
      return null;
    }

    return result.assets[0].uri;
  } catch (error) {
    console.error('❌ Error tomando foto:', error);
    return null;
  }
}

/**
 * Subir imagen a Supabase Storage
 * @param uri - URI local de la imagen
 * @param userId - ID del usuario (para el nombre del archivo)
 * @returns URL pública de la imagen o null si falla
 */
export async function uploadAvatar(uri: string, userId: string): Promise<string | null> {
  try {
    // Convertir URI a Blob
    const response = await fetch(uri);
    const blob = await response.blob();

    // Generar nombre único del archivo
    const fileExt = uri.split('.').pop() || 'jpg';
    const fileName = `${userId}-${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    console.log('📤 Subiendo avatar:', filePath);

    // Subir a Supabase Storage
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, blob, {
        contentType: `image/${fileExt}`,
        upsert: true, // Sobrescribir si ya existe
      });

    if (error) {
      console.error('❌ Error subiendo avatar:', error);
      return null;
    }

    // Obtener URL pública
    const { data: { publicUrl } } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    console.log('✅ Avatar subido:', publicUrl);
    return publicUrl;
  } catch (error) {
    console.error('❌ Error en uploadAvatar:', error);
    return null;
  }
}

/**
 * Actualizar avatar_url en tabla profiles
 */
export async function updateProfileAvatar(userId: string, avatarUrl: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ avatar_url: avatarUrl })
      .eq('id', userId);

    if (error) {
      console.error('❌ Error actualizando avatar en BD:', error);
      return false;
    }

    console.log('✅ Avatar actualizado en BD');
    return true;
  } catch (error) {
    console.error('❌ Error en updateProfileAvatar:', error);
    return false;
  }
}

/**
 * Eliminar avatar anterior de Storage (opcional, para limpiar)
 */
export async function deleteOldAvatar(avatarUrl: string): Promise<void> {
  try {
    // Extraer el nombre del archivo de la URL
    const fileName = avatarUrl.split('/').pop();
    if (!fileName) return;

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([fileName]);

    if (error) {
      console.warn('⚠️ No se pudo eliminar avatar anterior:', error);
    } else {
      console.log('🗑️ Avatar anterior eliminado');
    }
  } catch (error) {
    console.warn('⚠️ Error eliminando avatar anterior:', error);
  }
}

/**
 * Flujo completo: seleccionar imagen, subirla y actualizar perfil
 */
export async function changeAvatar(
  userId: string,
  source: 'gallery' | 'camera'
): Promise<{ success: boolean; avatarUrl?: string; error?: string }> {
  try {
    // 1. Seleccionar imagen
    const uri = source === 'gallery'
      ? await pickImageFromGallery()
      : await takePhotoWithCamera();

    if (!uri) {
      return { success: false, error: 'No se seleccionó imagen' };
    }

    // 2. Subir a Storage
    const avatarUrl = await uploadAvatar(uri, userId);
    if (!avatarUrl) {
      return { success: false, error: 'Error subiendo imagen' };
    }

    // 3. Actualizar BD
    const updated = await updateProfileAvatar(userId, avatarUrl);
    if (!updated) {
      return { success: false, error: 'Error actualizando perfil' };
    }

    return { success: true, avatarUrl };
  } catch (error) {
    console.error('❌ Error en changeAvatar:', error);
    return { success: false, error: 'Error inesperado' };
  }
}
