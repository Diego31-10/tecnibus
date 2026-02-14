import { Colors } from "@/lib/constants/colors";
import { SubScreenHeader, FormField } from "@/features/admin";
import {
  getUbicacionColegio,
  updateUbicacionColegio,
  type UbicacionColegio,
} from "@/lib/services/configuracion.service";
import { haptic } from "@/lib/utils/haptics";
import { useRouter } from "expo-router";
import { MapPin, Save, Settings } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker, MapPressEvent, Region } from "react-native-maps";
import Toast from "@/components/Toast";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const MAP_HEIGHT = 400;

export default function ConfiguracionScreen() {
  const router = useRouter();
  const mapRef = useRef<MapView>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [ubicacion, setUbicacion] = useState<UbicacionColegio>({
    latitud: -2.9, // Cuenca, Ecuador
    longitud: -79.0,
    nombre: "Colegio TecniBus",
  });
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: "success" | "error" | "warning" | "info";
  }>({ visible: false, message: "", type: "success" });

  useEffect(() => {
    loadUbicacion();
  }, []);

  const loadUbicacion = async () => {
    setLoading(true);
    const data = await getUbicacionColegio();
    setUbicacion(data);
    setLoading(false);

    // Centrar mapa en la ubicación
    if (mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: data.latitud,
          longitude: data.longitud,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        500
      );
    }
  };

  const handleMapPress = (e: MapPressEvent) => {
    haptic.light();
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setUbicacion({
      ...ubicacion,
      latitud: latitude,
      longitud: longitude,
    });
  };

  const handleSave = async () => {
    if (!ubicacion.nombre.trim()) {
      setToast({
        visible: true,
        message: "Ingresa el nombre del colegio",
        type: "warning",
      });
      return;
    }

    haptic.medium();
    setSaving(true);

    const success = await updateUbicacionColegio(ubicacion);

    setSaving(false);

    if (success) {
      setToast({
        visible: true,
        message: "Configuración guardada correctamente",
        type: "success",
      });
      setTimeout(() => router.back(), 1500);
    } else {
      setToast({
        visible: true,
        message: "Error al guardar la configuración",
        type: "error",
      });
    }
  };

  const initialRegion: Region = {
    latitude: ubicacion.latitud,
    longitude: ubicacion.longitud,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.tecnibus[50] }}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={Colors.tecnibus[700]}
        translucent={false}
      />

      <SubScreenHeader
        title="CONFIGURACIÓN"
        subtitle="Ubicación del colegio"
        icon={Settings}
        onBack={() => router.back()}
      />

      <ScrollView
        style={{ flex: 1, paddingHorizontal: 20, paddingTop: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View
            style={{ alignItems: "center", justifyContent: "center", paddingTop: 60 }}
          >
            <ActivityIndicator size="large" color={Colors.tecnibus[600]} />
            <Text style={{ color: "#6B7280", marginTop: 16 }}>
              Cargando configuración...
            </Text>
          </View>
        ) : (
          <>
            {/* Formulario */}
            <View
              style={{
                backgroundColor: "#fff",
                borderRadius: 16,
                padding: 20,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.06,
                shadowRadius: 3,
                elevation: 2,
                marginBottom: 16,
              }}
            >
              <FormField
                label="Nombre del colegio"
                icon={MapPin}
                required
                placeholder="Ej: Colegio TecniBus"
                value={ubicacion.nombre}
                onChangeText={(text) =>
                  setUbicacion({ ...ubicacion, nombre: text })
                }
                autoCapitalize="words"
              />

              <View style={{ flexDirection: "row", gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "600",
                      color: "#374151",
                      marginBottom: 6,
                    }}
                  >
                    Latitud
                  </Text>
                  <View
                    style={{
                      backgroundColor: "#F3F4F6",
                      borderRadius: 12,
                      padding: 12,
                    }}
                  >
                    <Text style={{ fontSize: 14, color: "#374151" }}>
                      {ubicacion.latitud.toFixed(6)}
                    </Text>
                  </View>
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "600",
                      color: "#374151",
                      marginBottom: 6,
                    }}
                  >
                    Longitud
                  </Text>
                  <View
                    style={{
                      backgroundColor: "#F3F4F6",
                      borderRadius: 12,
                      padding: 12,
                    }}
                  >
                    <Text style={{ fontSize: 14, color: "#374151" }}>
                      {ubicacion.longitud.toFixed(6)}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Mapa */}
            <View
              style={{
                backgroundColor: "#fff",
                borderRadius: 16,
                overflow: "hidden",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.06,
                shadowRadius: 3,
                elevation: 2,
                marginBottom: 16,
              }}
            >
              <View
                style={{
                  backgroundColor: Colors.tecnibus[600],
                  padding: 12,
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                <MapPin size={16} color="#ffffff" strokeWidth={2} />
                <Text
                  style={{
                    color: "#ffffff",
                    fontWeight: "600",
                    fontSize: 13,
                    marginLeft: 6,
                  }}
                >
                  Toca el mapa para ubicar el colegio
                </Text>
              </View>

              <View style={{ height: MAP_HEIGHT }}>
                <MapView
                  ref={mapRef}
                  style={{ flex: 1 }}
                  initialRegion={initialRegion}
                  onPress={handleMapPress}
                  mapType="standard"
                >
                  <Marker
                    coordinate={{
                      latitude: ubicacion.latitud,
                      longitude: ubicacion.longitud,
                    }}
                    title={ubicacion.nombre}
                    description="Ubicación del colegio"
                    pinColor={Colors.tecnibus[600]}
                  />
                </MapView>
              </View>
            </View>

            {/* Info */}
            <View
              style={{
                backgroundColor: Colors.tecnibus[50],
                borderRadius: 12,
                padding: 12,
                borderWidth: 1,
                borderColor: Colors.tecnibus[200],
                marginBottom: 16,
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  color: Colors.tecnibus[800],
                  textAlign: "center",
                }}
              >
                Esta ubicación se usará como destino final para las rutas de IDA.
              </Text>
            </View>

            {/* Botón guardar */}
            <TouchableOpacity
              onPress={handleSave}
              disabled={saving}
              style={{
                backgroundColor: Colors.tecnibus[600],
                borderRadius: 16,
                paddingVertical: 16,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                shadowColor: Colors.tecnibus[600],
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 4,
                elevation: 4,
                marginBottom: 40,
                opacity: saving ? 0.6 : 1,
              }}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Save size={20} color="#ffffff" strokeWidth={2.5} />
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "700",
                      color: "#ffffff",
                      marginLeft: 8,
                    }}
                  >
                    Guardar Configuración
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onDismiss={() => setToast({ ...toast, visible: false })}
      />
    </View>
  );
}
