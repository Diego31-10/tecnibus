import { useEffect, useRef, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, type Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { Bus } from 'lucide-react-native';
import { Colors } from '@/lib/constants/colors';
import type { Parada } from '@/lib/services/rutas.service';
import type { UbicacionActual } from '@/lib/services/ubicaciones.service';

const DEFAULT_REGION: Region = {
  latitude: 9.0,
  longitude: -79.5,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

type RouteMapProps = {
  paradas: Parada[];
  ubicacionBus: UbicacionActual | null;
  recorridoActivo: boolean;
};

export default function RouteMap({ paradas, ubicacionBus, recorridoActivo }: RouteMapProps) {
  const mapRef = useRef<MapView>(null);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<Region | null>(null);

  // Obtener ubicacion del dispositivo al montar
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;
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
        // Si no hay paradas, centrar en el usuario
        if (paradas.length === 0 && mapRef.current) {
          mapRef.current.animateToRegion(region, 500);
        }
      } catch (err) {
        console.warn('RouteMap: no se pudo obtener ubicacion del dispositivo', err);
      }
    })();
  }, []);

  // Calcular region basada en paradas
  const getRegionFromParadas = (): Region | null => {
    if (paradas.length === 0) return null;
    const latitudes = paradas.map(p => p.latitud);
    const longitudes = paradas.map(p => p.longitud);
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
    return getRegionFromParadas() || userLocation || DEFAULT_REGION;
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
      mapRef.current.animateCamera({
        center: { latitude: ubicacionBus.latitud, longitude: ubicacionBus.longitud },
        zoom: 15,
      }, { duration: 1000 });
    }
  }, [ubicacionBus, recorridoActivo]);

  // Coordenadas para la polyline
  const routeCoordinates = paradas
    .sort((a, b) => (a.orden || 0) - (b.orden || 0))
    .map(p => ({ latitude: p.latitud, longitude: p.longitud }));

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={getInitialRegion()}
        onMapReady={() => setLoading(false)}
        showsUserLocation={true}
        showsMyLocationButton={true}
        showsCompass={true}
        showsScale={true}
      >
        {/* Polyline de la ruta */}
        {routeCoordinates.length > 1 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor={Colors.tecnibus[600]}
            strokeWidth={4}
          />
        )}

        {/* Markers de paradas */}
        {paradas.map((parada, index) => (
          <Marker
            key={parada.id}
            coordinate={{ latitude: parada.latitud, longitude: parada.longitud }}
            title={parada.nombre || `Parada ${index + 1}`}
            description={parada.direccion || undefined}
            pinColor={index === 0 ? '#16a34a' : index === paradas.length - 1 ? '#dc2626' : Colors.tecnibus[600]}
          />
        ))}

        {/* Marker del bus */}
        {recorridoActivo && ubicacionBus && (
          <Marker
            coordinate={{ latitude: ubicacionBus.latitud, longitude: ubicacionBus.longitud }}
            title="Buseta"
            description={ubicacionBus.velocidad ? `${Math.round(ubicacionBus.velocidad)} km/h` : 'En camino'}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View style={styles.busMarker}>
              <Bus size={32} color="#ffffff" strokeWidth={2.5} />
            </View>
          </Marker>
        )}
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
  container: { flex: 1, overflow: 'hidden' },
  map: { flex: 1 },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: { marginTop: 8, color: '#6b7280', fontSize: 14 },
  busMarker: {
    backgroundColor: Colors.tecnibus[600],
    borderRadius: 20,
    padding: 8,
    borderWidth: 3,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
});
