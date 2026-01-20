/**
 * Funciones administrativas para desarrollo
 * NO usar en producción del cliente
 */

import { supabase } from './supabase';

/**
 * Obtiene el perfil de un usuario por su ID
 * Útil para debugging
 */
export async function getProfileById(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error obteniendo perfil:', error);
    return null;
  }

  return data;
}

/**
 * Obtiene todos los perfiles (solo para admin)
 * Útil para debugging
 */
export async function getAllProfiles() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*');

  if (error) {
    console.error('Error obteniendo perfiles:', error);
    return [];
  }

  return data;
}