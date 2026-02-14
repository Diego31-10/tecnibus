import { useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';
import { guardarUbicacion } from '@/lib/services/ubicaciones.service';

type UseGPSTrackingProps = {
  idAsignacion: string | null;
  idChofer: string;
  recorridoActivo: boolean;
  intervaloSegundos?: number;
  distanciaMinimaMetros?: number;
};

/** Distancia en metros entre dos coordenadas (fórmula Haversine simplificada) */
function distanciaMetros(
  lat1: number, lon1: number,
  lat2: number, lon2: number,
): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function useGPSTracking({
  idAsignacion,
  idChofer,
  recorridoActivo,
  intervaloSegundos = 15,
  distanciaMinimaMetros = 10,
}: UseGPSTrackingProps) {
  const [permisoConcedido, setPermisoConcedido] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const ultimaUbicacionRef = useRef<{ lat: number; lng: number } | null>(null);

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
    // Reset última ubicación al iniciar recorrido
    ultimaUbicacionRef.current = null;

    const enviarUbicacion = async () => {
      try {
        console.log('🔍 Solicitando ubicación GPS...');
        const ubicacion = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Low, // Cambio temporal: Low es más rápido que Balanced
          maximumAge: 10000, // Aceptar ubicación de hasta 10 segundos de antigüedad
          timeout: 15000, // Timeout de 15 segundos
        });

        const { latitude, longitude, speed, accuracy, heading } = ubicacion.coords;

        console.log('📡 GPS obtenido:', {
          lat: latitude.toFixed(6),
          lng: longitude.toFixed(6),
          speed: speed ? `${(speed * 3.6).toFixed(1)} km/h` : 'null',
        });

        // Filtro de distancia: no enviar si el bus no se movió lo suficiente
        const ultima = ultimaUbicacionRef.current;
        if (ultima) {
          const dist = distanciaMetros(ultima.lat, ultima.lng, latitude, longitude);
          console.log(`📏 Distancia desde última ubicación: ${dist.toFixed(1)}m (mínimo: ${distanciaMinimaMetros}m)`);
          if (dist < distanciaMinimaMetros) {
            console.log('⏭️ Ubicación ignorada (distancia mínima no alcanzada)');
            return; // Bus detenido o movimiento mínimo, no gastar datos
          }
        }

        await guardarUbicacion(
          idAsignacion,
          idChofer,
          latitude,
          longitude,
          speed ? speed * 3.6 : undefined,
          accuracy || undefined,
          heading || undefined
        );

        ultimaUbicacionRef.current = { lat: latitude, lng: longitude };
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
  }, [permisoConcedido, recorridoActivo, idAsignacion, idChofer, intervaloSegundos, distanciaMinimaMetros]);

  return { permisoConcedido, error, tracking: recorridoActivo && permisoConcedido };
}
