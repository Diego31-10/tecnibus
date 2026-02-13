/**
 * Servicio para obtener rutas reales usando Google Directions API
 */

// La Directions API usa la misma key que Maps (ambas son servicios de Google Maps Platform)
const GOOGLE_MAPS_API_KEY="AIzaSyDLZT0Pu4uBaXkcuGH0ZX23PFWzSZwUwHM";

export interface DirectionsResult {
  polyline: string; // Encoded polyline
  distance: number; // Distance in meters
  duration: number; // Duration in seconds
  decodedCoordinates: { latitude: number; longitude: number }[];
}

/**
 * Decodifica un polyline encoded de Google Maps
 * @param encoded - Polyline string encoded
 * @returns Array de coordenadas
 */
export function decodePolyline(encoded: string): { latitude: number; longitude: number }[] {
  const poly = [];
  let index = 0;
  const len = encoded.length;
  let lat = 0;
  let lng = 0;

  while (index < len) {
    let b;
    let shift = 0;
    let result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    poly.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }

  return poly;
}

/**
 * Obtiene la ruta real entre dos puntos usando Google Directions API
 * @param origin - Coordenadas de origen {lat, lng}
 * @param destination - Coordenadas de destino {lat, lng}
 * @returns DirectionsResult con polyline, distancia y duración
 */
export async function getDirections(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
): Promise<DirectionsResult | null> {
  try {
    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}&mode=driving&key=${GOOGLE_MAPS_API_KEY}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== "OK" || !data.routes || data.routes.length === 0) {
      console.error("Directions API error:", data.status);
      return null;
    }

    const route = data.routes[0];
    const leg = route.legs[0];
    const polyline = route.overview_polyline.points;

    return {
      polyline,
      distance: leg.distance.value, // meters
      duration: leg.duration.value, // seconds
      decodedCoordinates: decodePolyline(polyline),
    };
  } catch (error) {
    console.error("Error fetching directions:", error);
    return null;
  }
}

/**
 * Obtiene la ruta completa que conecta múltiples paradas en orden
 * @param waypoints - Array de coordenadas ordenadas
 * @returns DirectionsResult con polyline completa
 */
export async function getRouteForWaypoints(
  waypoints: { lat: number; lng: number }[],
): Promise<DirectionsResult | null> {
  if (waypoints.length < 2) {
    return null;
  }

  try {
    const origin = waypoints[0];
    const destination = waypoints[waypoints.length - 1];
    const intermediates = waypoints.slice(1, -1);

    // Build waypoints string
    const waypointsParam =
      intermediates.length > 0
        ? `&waypoints=${intermediates.map((w) => `${w.lat},${w.lng}`).join("|")}`
        : "";

    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}${waypointsParam}&mode=driving&key=${GOOGLE_MAPS_API_KEY}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== "OK" || !data.routes || data.routes.length === 0) {
      console.error("Directions API error:", data.status);
      return null;
    }

    const route = data.routes[0];
    const polyline = route.overview_polyline.points;

    // Calculate total distance and duration
    let totalDistance = 0;
    let totalDuration = 0;
    route.legs.forEach((leg: any) => {
      totalDistance += leg.distance.value;
      totalDuration += leg.duration.value;
    });

    return {
      polyline,
      distance: totalDistance,
      duration: totalDuration,
      decodedCoordinates: decodePolyline(polyline),
    };
  } catch (error) {
    console.error("Error fetching route for waypoints:", error);
    return null;
  }
}
