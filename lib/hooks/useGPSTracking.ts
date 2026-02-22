import { useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';
import { guardarUbicacion } from '@/lib/services/ubicaciones.service';

type UseGPSTrackingProps = {
  idAsignacion: string | null;
  idChofer: string;
  recorridoActivo: boolean;
  distanciaMinimaMetros?: number;
};

export type UbicacionLocal = {
  latitude: number;
  longitude: number;
  speed: number | null;
  heading: number | null;
};

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

/**
 * Hook GPS con watchPositionAsync para tracking continuo y suave.
 *
 * - Usa watchPositionAsync (event-driven) en lugar de setInterval+getCurrentPositionAsync
 * - En recorrido activo: BestForNavigation, cada 3s / 5m
 * - En inactivo: Balanced, cada 10s / 20m (para mostrar posición en mapa)
 * - Guarda en DB solo cuando el bus se movió ≥ distanciaMinimaMetros
 * - Expone `ubicacionActual` con latitude, longitude, speed y heading
 */
export function useGPSTracking({
  idAsignacion,
  idChofer,
  recorridoActivo,
  distanciaMinimaMetros = 10,
}: UseGPSTrackingProps) {
  const [permisoConcedido, setPermisoConcedido] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ubicacionActual, setUbicacionActual] = useState<UbicacionLocal | null>(null);

  const ultimaGuardadaRef = useRef<{ lat: number; lng: number } | null>(null);
  const suscripcionRef = useRef<Location.LocationSubscription | null>(null);

  // Solicitar permisos al montar
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setError('Permiso de ubicación denegado');
          return;
        }
        setPermisoConcedido(true);
      } catch {
        setError('Error al solicitar permisos de ubicación');
      }
    })();
  }, []);

  // Iniciar watchPositionAsync cuando hay permiso
  useEffect(() => {
    if (!permisoConcedido) return;

    let cancelled = false;

    const iniciarWatch = async () => {
      // Limpiar suscripción anterior
      if (suscripcionRef.current) {
        suscripcionRef.current.remove();
        suscripcionRef.current = null;
      }

      const sub = await Location.watchPositionAsync(
        {
          accuracy: recorridoActivo
            ? Location.Accuracy.BestForNavigation
            : Location.Accuracy.Balanced,
          timeInterval: recorridoActivo ? 3000 : 10000,
          distanceInterval: recorridoActivo ? 5 : 20,
        },
        (location) => {
          if (cancelled) return;

          const { latitude, longitude, speed, heading, accuracy } = location.coords;

          setUbicacionActual({
            latitude,
            longitude,
            speed: speed != null ? speed * 3.6 : null,
            heading: heading ?? null,
          });

          // Guardar en DB solo cuando el recorrido está activo y se movió lo suficiente
          if (!recorridoActivo || !idAsignacion) return;

          const ultima = ultimaGuardadaRef.current;
          if (ultima) {
            const dist = distanciaMetros(ultima.lat, ultima.lng, latitude, longitude);
            if (dist < distanciaMinimaMetros) return;
          }

          guardarUbicacion(
            idAsignacion,
            idChofer,
            latitude,
            longitude,
            speed ? speed * 3.6 : undefined,
            accuracy || undefined,
            heading ?? undefined,
          ).then(() => {
            ultimaGuardadaRef.current = { lat: latitude, lng: longitude };
          }).catch(console.error);
        },
      );

      if (!cancelled) {
        suscripcionRef.current = sub;
      } else {
        sub.remove();
      }
    };

    iniciarWatch();

    return () => {
      cancelled = true;
      if (suscripcionRef.current) {
        suscripcionRef.current.remove();
        suscripcionRef.current = null;
      }
    };
  }, [permisoConcedido, recorridoActivo, idAsignacion, idChofer, distanciaMinimaMetros]);

  // Resetear última posición guardada al detener recorrido
  useEffect(() => {
    if (!recorridoActivo) {
      ultimaGuardadaRef.current = null;
    }
  }, [recorridoActivo]);

  return {
    permisoConcedido,
    error,
    tracking: recorridoActivo && permisoConcedido,
    ubicacionActual,
  };
}
