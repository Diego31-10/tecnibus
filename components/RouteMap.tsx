import { useEffect, useRef, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { Bus } from 'lucide-react-native';
import type { Parada } from '@/lib/services/rutas.service';
import type { UbicacionActual } from '@/lib/services/ubicaciones.service';

type RouteMapProps = {
  paradas: Parada[];
  ubicacionBus: UbicacionActual | null;
  recorridoActivo: boolean;
};

export default function RouteMap({ paradas, ubicacionBus, recorridoActivo }: RouteMapProps) {
  const mapRef = useRef<MapView>(null);
  const [loading, setLoading] = useState(true);

  // Calcular región inicial centrada en las paradas
  const getInitialRegion = () => {
    if (paradas.length === 0) {
      return { latitude: 4.7110, longitude: -74.0721, latitudeDelta: 0.05, longitudeDelta: 0.05 };
    }

    const latitudes = paradas.map(p => p.latitud);
    const longitudes = paradas.map(p => p.longitud);
    const minLat = Math.min(...latitudes);
    const maxLat = Math.max(...latitudes);
    const minLng = Math.min(...longitudes);
    const maxLng = Math.max(...longitudes);
    const centerLat = (minLat + maxLat) / 2;
    const centerLng = (minLng + maxLng) / 2;
    const latDelta = (maxLat - minLat) * 1.2 || 0.01;
    const lngDelta = (maxLng - minLng) * 1.2 || 0.01;

    return { latitude: centerLat, longitude: centerLng, latitudeDelta: latDelta, longitudeDelta: lngDelta };
  };

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
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={true}
        showsScale={true}
      >
        {/* Polyline de la ruta */}
        {routeCoordinates.length > 1 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor="#2563eb"
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
            pinColor={index === 0 ? '#16a34a' : index === paradas.length - 1 ? '#dc2626' : '#2563eb'}
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
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Cargando mapa...</Text>
        </View>
      )}

      {!recorridoActivo && (
        <View style={styles.inactiveOverlay}>
          <Text style={styles.inactiveText}>Recorrido no iniciado</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { height: 400, borderRadius: 12, overflow: 'hidden' },
  map: { flex: 1 },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: { marginTop: 8, color: '#6b7280', fontSize: 14 },
  inactiveOverlay: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 12,
    borderRadius: 8,
  },
  inactiveText: { color: '#ffffff', fontSize: 14, fontWeight: '600', textAlign: 'center' },
  busMarker: {
    backgroundColor: '#ca8a04',
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
