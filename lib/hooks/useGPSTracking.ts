import { useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';
import { guardarUbicacion } from '@/lib/services/ubicaciones.service';

type UseGPSTrackingProps = {
  idAsignacion: string | null;
  idChofer: string;
  recorridoActivo: boolean;
  distanciaMinimaMetros?: number; // mantenido por compatibilidad, no usado internamente
};

export type UbicacionLocal = {
  latitude: number;
  longitude: number;
  speed: number | null;
  heading: number | null;  // heading raw del GPS
  bearing: number;          // bearing suavizado calculado desde posiciones (nunca null)
};

type MovementState = 'activo' | 'lento' | 'detenido';

// Umbral de escritura a DB por estado (metros)
const DB_THRESHOLD: Record<MovementState, number | null> = {
  activo: 15,
  lento: 25,
  detenido: null, // no escribir
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

// Calcula el ángulo de dirección entre dos puntos (0–360°)
function calcularBearingDePosiciones(
  lat1: number, lon1: number,
  lat2: number, lon2: number,
): number {
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const lat1Rad = (lat1 * Math.PI) / 180;
  const lat2Rad = (lat2 * Math.PI) / 180;
  const y = Math.sin(dLon) * Math.cos(lat2Rad);
  const x =
    Math.cos(lat1Rad) * Math.sin(lat2Rad) -
    Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

// Interpolación exponencial con shortest-path para evitar wraparound 350°→10° = +340°
function suavizarAngulo(current: number, target: number, factor: number): number {
  const diff = ((target - current + 540) % 360) - 180;
  return (current + diff * factor + 360) % 360;
}

/**
 * Hook GPS con pipeline de filtrado avanzado — estilo Uber V3.
 *
 * - Una sola suscripción watchPositionAsync durante todo el recorrido
 * - Filtro de precisión: descarta puntos con accuracy > 50m
 * - Validación física: descarta teleportaciones (> 150 km/h implícito)
 * - Bearing calculado desde posiciones + suavizado EMA(0.3)
 * - Bearing congelado al detenerse (sin snap a norte)
 * - Throttle de setState: no re-renderiza si distancia < 2m y bearing < 3°
 * - DB writes optimizados por estado: activo=15m, lento=25m, detenido=nunca
 */
export function useGPSTracking({
  idAsignacion,
  idChofer,
  recorridoActivo,
}: UseGPSTrackingProps) {
  const [permisoConcedido, setPermisoConcedido] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ubicacionActual, setUbicacionActual] = useState<UbicacionLocal | null>(null);

  const ultimaGuardadaRef = useRef<{ lat: number; lng: number } | null>(null);
  const suscripcionRef = useRef<Location.LocationSubscription | null>(null);

  // Refs de pipeline V3
  const prevPositionRef = useRef<{ lat: number; lng: number; timestamp: number } | null>(null);
  const lastBearingRef = useRef<number>(0);
  const consecutiveStopsRef = useRef<number>(0);
  const movementStateRef = useRef<MovementState>('detenido');

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
          const timestamp = location.timestamp;

          // PASO A: Filtro de precisión — descartar GPS poco confiable
          if (accuracy != null && accuracy > 50) return;

          const prev = prevPositionRef.current;

          // PASO B: Validación física — anti-teleportación
          if (prev) {
            const deltaTime = timestamp - prev.timestamp;
            const dist = distanciaMetros(prev.lat, prev.lng, latitude, longitude);
            if (deltaTime > 0) {
              const velocidadImplicada = (dist / (deltaTime / 1000)) * 3.6; // km/h
              if (velocidadImplicada > 150) return;
            }
          }

          // PASO C: Criterio híbrido de movimiento
          const speedKmh = speed != null ? speed * 3.6 : 0;
          const distance = prev
            ? distanciaMetros(prev.lat, prev.lng, latitude, longitude)
            : 0;
          const enMovimiento = distance > 2 || speedKmh > 3;

          // PASO D: Estado de movimiento (sin reiniciar watchPositionAsync)
          if (!enMovimiento) {
            consecutiveStopsRef.current += 1;
          } else {
            consecutiveStopsRef.current = 0;
          }

          let newState: MovementState;
          if (consecutiveStopsRef.current >= 3) {
            newState = 'detenido';
          } else if (distance <= 8) {
            newState = 'lento';
          } else {
            newState = 'activo';
          }
          movementStateRef.current = newState;

          // PASO E: Cálculo de bearing — capturar antes de actualizar para PASO F
          const prevBearing = lastBearingRef.current;
          if (enMovimiento && prev) {
            const rawBearing = calcularBearingDePosiciones(
              prev.lat, prev.lng,
              latitude, longitude,
            );
            lastBearingRef.current = suavizarAngulo(lastBearingRef.current, rawBearing, 0.3);
          }
          // else: lastBearingRef queda congelado — sin snap a 0° al detenerse

          // PASO F: Throttle de setState — evitar renders cuando no hay cambio real
          const bearingDiff = Math.abs(((lastBearingRef.current - prevBearing + 540) % 360) - 180);
          if (distance < 2 && bearingDiff < 3) {
            prevPositionRef.current = { lat: latitude, lng: longitude, timestamp };
            return;
          }

          // PASO G: Actualizar posición previa
          prevPositionRef.current = { lat: latitude, lng: longitude, timestamp };

          setUbicacionActual({
            latitude,
            longitude,
            speed: speed != null ? speed * 3.6 : null,
            heading: heading ?? null,
            bearing: lastBearingRef.current,
          });

          // Guardar en DB según estado de movimiento
          if (!recorridoActivo || !idAsignacion) return;
          const umbralDB = DB_THRESHOLD[movementStateRef.current];
          if (umbralDB === null) return; // detenido → no escribir

          const ultima = ultimaGuardadaRef.current;
          if (ultima) {
            const distDB = distanciaMetros(ultima.lat, ultima.lng, latitude, longitude);
            if (distDB < umbralDB) return;
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
  }, [permisoConcedido, recorridoActivo, idAsignacion, idChofer]);

  // Resetear estado al detener el recorrido
  useEffect(() => {
    if (!recorridoActivo) {
      ultimaGuardadaRef.current = null;
      prevPositionRef.current = null;
      consecutiveStopsRef.current = 0;
      movementStateRef.current = 'detenido';
    }
  }, [recorridoActivo]);

  return {
    permisoConcedido,
    error,
    tracking: recorridoActivo && permisoConcedido,
    ubicacionActual,
  };
}
