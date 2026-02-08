import { supabase } from './supabase';
import { Alert } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';

const BUCKET_NAME = 'avatares';

// Importación condicional para evitar error en dev mode sin EAS build
let ImagePicker: any = null;
try {
  ImagePicker = require('react-native-image-crop-picker').default;
} catch (e) {
  console.warn('⚠️ react-native-image-crop-picker no disponible. Necesitas un development build para usar esta feature.');
}

/**
 * Seleccionar imagen desde galería con crop
 */
export async function pickImageFromGallery(): Promise<string | null> {
  if (!ImagePicker) {
    Alert.alert(
      'Feature no disponible',
      'La selección de fotos requiere un development build. Usa "eas build --profile development" para habilitar esta funcionalidad.'
    );
    return null;
  }

  try {
    const image = await ImagePicker.openPicker({
      width: 400,
      height: 400,
      cropping: true,
      cropperCircleOverlay: true,
      compressImageQuality: 0.8,
      mediaType: 'photo',
      includeBase64: false,
    });

    return image.path;
  } catch (error: any) {
    if (error.code === 'E_PICKER_CANCELLED') {
      console.log('🚫 Usuario canceló selección');
      return null;
    }
    console.error('❌ Error seleccionando imagen:', error);
    return null;
  }
}

/**
 * Tomar foto con cámara y crop
 */
export async function takePhotoWithCamera(): Promise<string | null> {
  if (!ImagePicker) {
    Alert.alert(
      'Feature no disponible',
      'La cámara requiere un development build. Usa "eas build --profile development" para habilitar esta funcionalidad.'
    );
    return null;
  }

  try {
    const image = await ImagePicker.openCamera({
      width: 400,
      height: 400,
      cropping: true,
      cropperCircleOverlay: true,
      compressImageQuality: 0.8,
      mediaType: 'photo',
      includeBase64: false,
    });

    return image.path;
  } catch (error: any) {
    if (error.code === 'E_PICKER_CANCELLED') {
      console.log('🚫 Usuario canceló captura');
      return null;
    }
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
    console.log('📤 Preparando subida desde:', uri);

    // Leer archivo como base64 (usar string literal en lugar de enum)
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: 'base64',
    });

    // Convertir base64 a Uint8Array
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);

    // Determinar el tipo MIME y extensión
    const fileExt = uri.split('.').pop()?.toLowerCase() || 'jpg';
    const mimeType = fileExt === 'png' ? 'image/png' : 'image/jpeg';

    // Generar nombre único del archivo
    const fileName = `${userId}-${Date.now()}.${fileExt}`;

    console.log('📤 Subiendo avatar:', fileName, 'tipo:', mimeType, 'tamaño:', byteArray.length, 'bytes');

    // Subir a Supabase Storage
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, byteArray, {
        contentType: mimeType,
        upsert: true,
      });

    if (error) {
      console.error('❌ Error subiendo avatar:', error);
      return null;
    }

    // Obtener URL pública
    const { data: { publicUrl } } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(fileName);

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
