import { useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';
import { guardarUbicacion } from '@/lib/services/ubicaciones.service';

type UseGPSTrackingProps = {
  idAsignacion: string | null;
  idChofer: string;
  recorridoActivo: boolean;
  intervaloSegundos?: number; // Default 10 segundos
};

export function useGPSTracking({
  idAsignacion,
  idChofer,
  recorridoActivo,
  intervaloSegundos = 10,
}: UseGPSTrackingProps) {
  const [permisoConcedido, setPermisoConcedido] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Solicitar permisos al montar
  useEffect(() => {
    const solicitarPermisos = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setError('Permiso de ubicación denegado');
          return;
        }
        setPermisoConcedido(true);
      } catch (err) {
        console.error('Error solicitando permisos GPS:', err);
        setError('Error al solicitar permisos de ubicación');
      }
    };
    solicitarPermisos();
  }, []);

  // Iniciar/detener tracking según estado del recorrido
  useEffect(() => {
    if (!permisoConcedido || !recorridoActivo || !idAsignacion) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        console.log('⏹️ GPS tracking detenido');
      }
      return;
    }

    console.log('▶️ GPS tracking iniciado');

    const enviarUbicacion = async () => {
      try {
        const ubicacion = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

        const { latitude, longitude, speed, accuracy } = ubicacion.coords;

        await guardarUbicacion(
          idAsignacion,
          idChofer,
          latitude,
          longitude,
          speed ? speed * 3.6 : undefined, // Convertir m/s a km/h
          accuracy || undefined
        );

        console.log(`✅ Ubicación guardada: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
      } catch (err) {
        console.error('❌ Error obteniendo ubicación GPS:', err);
      }
    };

    // Enviar inmediatamente
    enviarUbicacion();

    // Configurar intervalo
    intervalRef.current = setInterval(enviarUbicacion, intervaloSegundos * 1000);

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [permisoConcedido, recorridoActivo, idAsignacion, idChofer, intervaloSegundos]);

  return { permisoConcedido, error, tracking: recorridoActivo && permisoConcedido };
}
