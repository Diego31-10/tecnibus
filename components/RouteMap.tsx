import { Colors } from "@/lib/constants/colors";
import type { Parada } from "@/lib/services/rutas.service";
import type { UbicacionActual } from "@/lib/services/ubicaciones.service";
import * as Location from "expo-location";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  View
} from "react-native";
import MapView, {
  Marker,
  Polyline,
  PROVIDER_GOOGLE,
  type Region,
} from "react-native-maps";

// Resolver la imagen de la buseta para React Native Maps
const busImage = require("@/assets/images/bus-upview.png");

// Componente de marker personalizado para la buseta
const BusMarker = () => (
  <Image
    source={busImage}
    style={{ width: 35, height: 35 }}
    resizeMode="contain"
  />
);

const DEFAULT_REGION: Region = {
  latitude: -2.9, // Cuenca, Ecuador
  longitude: -79.0,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

type RouteMapProps = {
  paradas: Parada[];
  ubicacionBus: UbicacionActual | null;
  recorridoActivo: boolean;
  polylineCoordinates?: { latitude: number; longitude: number }[];
  ubicacionColegio?: {
    latitud: number;
    longitud: number;
    nombre: string;
  } | null;
  mostrarUbicacionChofer?: boolean; // Para mostrar ubicación del chofer siempre (en vista chofer)
  ubicacionChofer?: { latitude: number; longitude: number } | null; // Ubicación actual del chofer
  showsUserLocation?: boolean; // Controla si se muestra el círculo azul del usuario (default: true)
};

export default function RouteMap({
  paradas,
  ubicacionBus,
  recorridoActivo,
  polylineCoordinates,
  ubicacionColegio,
  mostrarUbicacionChofer = false,
  ubicacionChofer = null,
  showsUserLocation = true,
}: RouteMapProps) {
  const mapRef = useRef<MapView>(null);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<Region | null>(null);

  // DEBUG: Log props para entender por qué no se renderiza el marker
  console.log("🗺️ RouteMap props:", {
    recorridoActivo,
    ubicacionBus,
    mostrarUbicacionChofer,
    ubicacionChofer,
    hayParadas: paradas.length,
    hayPolyline: polylineCoordinates?.length || 0,
    showsUserLocation,
  });

  // Obtener ubicación del dispositivo solo si showsUserLocation es true (para chofer)
  useEffect(() => {
    if (!showsUserLocation) return;

    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") return;
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        const region: Region = {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        };
        setUserLocation(region);
        // Si no hay paradas, centrar en el usuario (útil para chofer)
        if (paradas.length === 0 && mapRef.current) {
          mapRef.current.animateToRegion(region, 500);
        }
      } catch (err) {
        console.warn(
          "RouteMap: no se pudo obtener ubicación del dispositivo",
          err,
        );
      }
    })();
  }, [showsUserLocation]);

  // Calcular region basada en paradas
  const getRegionFromParadas = (): Region | null => {
    if (paradas.length === 0) return null;
    const latitudes = paradas.map((p) => p.latitud);
    const longitudes = paradas.map((p) => p.longitud);
    const minLat = Math.min(...latitudes);
    const maxLat = Math.max(...latitudes);
    const minLng = Math.min(...longitudes);
    const maxLng = Math.max(...longitudes);
    return {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: (maxLat - minLat) * 1.2 || 0.01,
      longitudeDelta: (maxLng - minLng) * 1.2 || 0.01,
    };
  };

  const getInitialRegion = (): Region => {
    // Prioridad: paradas > ubicación usuario (si showsUserLocation) > default
    return getRegionFromParadas() || (showsUserLocation ? userLocation : null) || DEFAULT_REGION;
  };

  // Centrar en paradas cuando se cargan
  useEffect(() => {
    const region = getRegionFromParadas();
    if (region && mapRef.current) {
      mapRef.current.animateToRegion(region, 600);
    }
  }, [paradas]);

  // Auto-centrar en el bus cuando se mueve
  useEffect(() => {
    if (ubicacionBus && mapRef.current && recorridoActivo) {
      mapRef.current.animateCamera(
        {
          center: {
            latitude: ubicacionBus.latitud,
            longitude: ubicacionBus.longitud,
          },
          zoom: 15,
        },
        { duration: 1000 },
      );
    }
  }, [ubicacionBus, recorridoActivo]);

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={getInitialRegion()}
        onMapReady={() => setLoading(false)}
        showsUserLocation={showsUserLocation}
        showsMyLocationButton={true}
        showsCompass={true}
        showsScale={true}
      >
        {/* Polyline de la ruta optimizada */}
        {polylineCoordinates && polylineCoordinates.length > 0 && (
          <Polyline
            coordinates={polylineCoordinates}
            strokeColor={Colors.tecnibus[600]}
            strokeWidth={4}
            lineCap="round"
            lineJoin="round"
          />
        )}

        {/* Marker del colegio - ROJO */}
        {ubicacionColegio && (
          <Marker
            coordinate={{
              latitude: ubicacionColegio.latitud,
              longitude: ubicacionColegio.longitud,
            }}
            title={ubicacionColegio.nombre || "Colegio"}
            description="Punto de inicio/destino"
            pinColor="#dc2626"
          />
        )}

        {/* Markers de paradas - TODOS CELESTES */}
        {paradas.map((parada, index) => (
          <Marker
            key={parada.id}
            coordinate={{
              latitude: parada.latitud,
              longitude: parada.longitud,
            }}
            title={parada.nombre || `Parada ${index + 1}`}
            description={parada.direccion || undefined}
            pinColor={Colors.tecnibus[600]}
          />
        ))}

        {/* Marker del bus en tiempo real (cuando recorrido activo) */}
        {(() => {
          console.log("🔍 Evaluando condiciones de marker:", {
            recorridoActivo,
            tieneUbicacionBus: !!ubicacionBus,
            mostrarUbicacionChofer,
            tieneUbicacionChofer: !!ubicacionChofer,
          });

          if (recorridoActivo && ubicacionBus) {
            console.log("🚌 Renderizando marker con recorrido activo:", {
              lat: ubicacionBus.latitud,
              lng: ubicacionBus.longitud,
              velocidad: ubicacionBus.velocidad,
            });
            return (
              <Marker
                coordinate={{
                  latitude: ubicacionBus.latitud,
                  longitude: ubicacionBus.longitud,
                }}
                title="Buseta en ruta"
                description={
                  ubicacionBus.velocidad
                    ? `${Math.round(ubicacionBus.velocidad)} km/h`
                    : "En camino"
                }
                anchor={{ x: 0.5, y: 0.5 }}
                flat={true}
              >
                <BusMarker />
              </Marker>
            );
          }

          if (mostrarUbicacionChofer && ubicacionChofer) {
            console.log(
              "📍 Renderizando marker chofer sin recorrido:",
              ubicacionChofer,
            );
            return (
              <Marker
                coordinate={ubicacionChofer}
                title="Mi ubicación"
                description="Ubicación actual del chofer"
                anchor={{ x: 0.5, y: 0.5 }}
                flat={true}
              >
                <BusMarker />
              </Marker>
            );
          }

          console.log("⚠️ Ninguna condición se cumplió, no se muestra marker");
          return null;
        })()}
      </MapView>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={Colors.tecnibus[600]} />
          <Text style={styles.loadingText}>Cargando mapa...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, overflow: "hidden" },
  map: { flex: 1 },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: { marginTop: 8, color: "#6b7280", fontSize: 14 },
  busMarkerContainer: {
    width: 35,
    height: 35,
    justifyContent: "center",
    alignItems: "center",
  },
  busMarker: {
    width: 35,
    height: 35,
  },
  busFallback: {
    position: "absolute",
    width: 35,
    height: 35,
    backgroundColor: Colors.tecnibus[600],
    borderRadius: 18,
    borderWidth: 3,
    borderColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
  },
});
