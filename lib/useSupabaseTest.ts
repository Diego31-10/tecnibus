import { useEffect, useState } from 'react';
import { supabase } from './supabase';

/**
 * Hook temporal para verificar la conexión con Supabase
 * Se eliminará en fases posteriores
 */
export function useSupabaseTest() {
  const [status, setStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    testConnection();
  }, []);

  const testConnection = async () => {
    try {
      // Intentar obtener la sesión actual (debería ser null si no hay usuario)
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        setStatus('error');
        setError(error.message);
        console.error('❌ Error conectando a Supabase:', error);
      } else {
        setStatus('connected');
        console.log('✅ Conexión exitosa a Supabase');
        console.log('📊 Sesión actual:', data.session ? 'Existe' : 'No existe (correcto)');
      }
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Error desconocido');
      console.error('❌ Error en test de conexión:', err);
    }
  };

  return { status, error };
}