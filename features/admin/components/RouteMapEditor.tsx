import { Colors } from "@/lib/constants/colors";
import { haptic } from "@/lib/utils/haptics";
import {
  Clock,
  Edit3,
  GripVertical,
  MapPin,
  Plus,
  Trash2,
} from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker, Polyline, MapPressEvent, Region } from "react-native-maps";
import {
  Parada,
  createParada,
  updateParada,
  deleteParada,
} from "@/lib/services/rutas.service";
import { getRouteForWaypoints } from "@/lib/services/directions.service";
import { ParadaFormSheet } from "./ParadaFormSheet";
import DraggableFlatList, { ScaleDecorator } from "react-native-draggable-flatlist";
import { GestureHandlerRootView } from "react-native-gesture-handler";

interface RouteMapEditorProps {
  rutaId: string;
  paradas: Parada[];
  onParadaCreated: () => void;
  onParadaUpdated: () => void;
  onParadaDeleted: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const MAP_HEIGHT = 320;

// Default to Panama City
const DEFAULT_REGION: Region = {
  latitude: 9.0,
  longitude: -79.5,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

function getMarkerColor(index: number, total: number): string {
  if (index === 0) return "#16A34A";
  if (index === total - 1) return "#DC2626";
  return Colors.tecnibus[600];
}

export function RouteMapEditor({
  rutaId,
  paradas,
  onParadaCreated,
  onParadaUpdated,
  onParadaDeleted,
}: RouteMapEditorProps) {
  const mapRef = useRef<MapView>(null);
  const [addMode, setAddMode] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingParada, setEditingParada] = useState<Parada | null>(null);
  const [newCoords, setNewCoords] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [routeCoordinates, setRouteCoordinates] = useState<
    { latitude: number; longitude: number }[]
  >([]);

  const sortedParadas = [...paradas].sort(
    (a, b) => (a.orden || 0) - (b.orden || 0)
  );

  const initialRegion: Region =
    sortedParadas.length > 0
      ? {
          latitude: sortedParadas[0].latitud,
          longitude: sortedParadas[0].longitud,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        }
      : DEFAULT_REGION;

  // Obtener ruta real de Google Directions API
  useEffect(() => {
    if (sortedParadas.length < 2) {
      setRouteCoordinates([]);
      return;
    }

    (async () => {
      setLoadingRoute(true);
      try {
        const waypoints = sortedParadas.map((p) => ({
          lat: p.latitud,
          lng: p.longitud,
        }));

        const directionsResult = await getRouteForWaypoints(waypoints);

        if (
          directionsResult &&
          directionsResult.decodedCoordinates.length > 0
        ) {
          setRouteCoordinates(directionsResult.decodedCoordinates);
        } else {
          // Fallback: líneas rectas
          setRouteCoordinates(
            sortedParadas.map((p) => ({
              latitude: p.latitud,
              longitude: p.longitud,
            }))
          );
        }
      } catch (error) {
        console.error("Error obteniendo ruta:", error);
        // Fallback: líneas rectas
        setRouteCoordinates(
          sortedParadas.map((p) => ({
            latitude: p.latitud,
            longitude: p.longitud,
          }))
        );
      } finally {
        setLoadingRoute(false);
      }
    })();
  }, [
    sortedParadas.map((p) => `${p.id}-${p.orden}-${p.latitud}-${p.longitud}`).join(","),
  ]);

  const handleMapPress = useCallback(
    (e: MapPressEvent) => {
      if (!addMode) return;
      haptic.light();
      const { latitude, longitude } = e.nativeEvent.coordinate;
      setNewCoords({ latitude, longitude });
      setEditingParada(null);
      setShowForm(true);
      setAddMode(false);
    },
    [addMode]
  );

  const handleMarkerPress = useCallback((parada: Parada) => {
    haptic.light();
    setEditingParada(parada);
    setNewCoords(null);
    setShowForm(true);
  }, []);

  const handleSave = async (data: {
    nombre: string;
    direccion: string;
    latitud: number;
    longitud: number;
    hora_aprox: string | null;
    orden: number;
  }): Promise<boolean> => {
    if (editingParada) {
      const success = await updateParada(editingParada.id, data);
      if (success) onParadaUpdated();
      return success;
    } else {
      const result = await createParada({
        id_ruta: rutaId,
        ...data,
      });
      if (result) onParadaCreated();
      return !!result;
    }
  };

  const handleDelete = async (): Promise<boolean> => {
    if (!editingParada) return false;
    const success = await deleteParada(editingParada.id);
    if (success) onParadaDeleted();
    return success;
  };

  const confirmDeleteParada = (parada: Parada) => {
    haptic.medium();
    Alert.alert(
      "Eliminar Parada",
      `¿Eliminar "${parada.nombre || "esta parada"}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            const success = await deleteParada(parada.id);
            if (success) onParadaDeleted();
          },
        },
      ]
    );
  };

  const handleDragEnd = async ({ data }: { data: Parada[] }) => {
    haptic.light();
    // Actualizar orden en backend
    const promises = data.map((parada, index) =>
      updateParada(parada.id, {
        nombre: parada.nombre || "",
        direccion: parada.direccion || "",
        latitud: parada.latitud,
        longitud: parada.longitud,
        hora_aprox: parada.hora_aprox,
        orden: index + 1,
      })
    );
    await Promise.all(promises);
    onParadaUpdated();
  };

  return (
    <View>
      {/* Map */}
      <View
        style={{
          height: MAP_HEIGHT,
          borderRadius: 16,
          overflow: "hidden",
          marginHorizontal: 20,
          marginTop: 16,
          borderWidth: addMode ? 2 : 0,
          borderColor: addMode ? Colors.tecnibus[600] : "transparent",
        }}
      >
        <MapView
          ref={mapRef}
          style={{ flex: 1 }}
          initialRegion={initialRegion}
          onPress={handleMapPress}
          mapType="standard"
        >
          {sortedParadas.map((parada, index) => (
            <Marker
              key={parada.id}
              coordinate={{
                latitude: parada.latitud,
                longitude: parada.longitud,
              }}
              onPress={() => handleMarkerPress(parada)}
              title={parada.nombre || `Parada ${index + 1}`}
              description={parada.direccion || undefined}
            >
              <View
                style={{
                  backgroundColor: getMarkerColor(
                    index,
                    sortedParadas.length
                  ),
                  width: 30,
                  height: 30,
                  borderRadius: 15,
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 2,
                  borderColor: "#ffffff",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.25,
                  shadowRadius: 3,
                  elevation: 4,
                }}
              >
                <Text
                  style={{
                    color: "#ffffff",
                    fontSize: 12,
                    fontWeight: "800",
                  }}
                >
                  {index + 1}
                </Text>
              </View>
            </Marker>
          ))}

          {routeCoordinates.length >= 2 && (
            <Polyline
              coordinates={routeCoordinates}
              strokeColor={Colors.tecnibus[600]}
              strokeWidth={5}
            />
          )}
        </MapView>

        {/* Loading route overlay */}
        {loadingRoute && (
          <View
            style={{
              position: "absolute",
              top: 10,
              right: 10,
              backgroundColor: Colors.tecnibus[600],
              borderRadius: 10,
              padding: 8,
              paddingHorizontal: 12,
              flexDirection: "row",
              alignItems: "center",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.2,
              shadowRadius: 4,
              elevation: 4,
            }}
          >
            <ActivityIndicator size="small" color="#ffffff" />
            <Text
              style={{
                color: "#ffffff",
                fontWeight: "600",
                fontSize: 12,
                marginLeft: 8,
              }}
            >
              Obteniendo ruta...
            </Text>
          </View>
        )}

        {/* Add mode overlay */}
        {addMode && (
          <View
            style={{
              position: "absolute",
              top: 10,
              left: 10,
              right: 10,
              backgroundColor: Colors.tecnibus[600],
              borderRadius: 10,
              padding: 10,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
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
              Toca el mapa para ubicar la parada
            </Text>
          </View>
        )}
      </View>

      {/* FAB Add button */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "flex-end",
          paddingHorizontal: 20,
          marginTop: -20,
          marginBottom: 8,
          zIndex: 10,
        }}
      >
        <TouchableOpacity
          onPress={() => {
            haptic.medium();
            setAddMode(!addMode);
          }}
          style={{
            backgroundColor: addMode ? "#DC2626" : Colors.tecnibus[600],
            width: 44,
            height: 44,
            borderRadius: 22,
            alignItems: "center",
            justifyContent: "center",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 4,
            elevation: 6,
          }}
        >
          {addMode ? (
            <Text style={{ color: "#fff", fontSize: 20, fontWeight: "700" }}>
              x
            </Text>
          ) : (
            <Plus size={22} color="#ffffff" strokeWidth={2.5} />
          )}
        </TouchableOpacity>
      </View>

      {/* Paradas list with drag & drop */}
      <GestureHandlerRootView style={{ paddingHorizontal: 20 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 8,
          }}
        >
          <Text
            style={{
              fontSize: 14,
              fontWeight: "700",
              color: "#374151",
            }}
          >
            Paradas ({sortedParadas.length})
          </Text>
          <Text
            style={{
              fontSize: 11,
              color: "#9CA3AF",
              fontWeight: "600",
            }}
          >
            Mantén presionado para reordenar
          </Text>
        </View>

        {sortedParadas.length === 0 ? (
          <View
            style={{
              backgroundColor: Colors.tecnibus[50],
              borderRadius: 12,
              padding: 20,
              alignItems: "center",
              borderWidth: 1,
              borderColor: Colors.tecnibus[200],
            }}
          >
            <MapPin
              size={32}
              color={Colors.tecnibus[400]}
              strokeWidth={1.5}
            />
            <Text
              style={{
                color: "#6B7280",
                fontSize: 13,
                marginTop: 8,
                textAlign: "center",
              }}
            >
              Sin paradas. Toca [+] y luego el mapa para agregar.
            </Text>
          </View>
        ) : (
          <DraggableFlatList
            data={sortedParadas}
            onDragEnd={handleDragEnd}
            keyExtractor={(item) => item.id}
            renderItem={({ item, drag, isActive }) => {
              const index = sortedParadas.indexOf(item);
              return (
                <ScaleDecorator>
                  <TouchableOpacity
                    onLongPress={drag}
                    disabled={isActive}
                    activeOpacity={0.7}
                    style={{
                      backgroundColor: isActive
                        ? Colors.tecnibus[50]
                        : "#ffffff",
                      borderRadius: 12,
                      padding: 12,
                      marginBottom: 8,
                      flexDirection: "row",
                      alignItems: "center",
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: isActive ? 0.15 : 0.04,
                      shadowRadius: isActive ? 4 : 2,
                      elevation: isActive ? 4 : 1,
                      borderWidth: isActive ? 2 : 0,
                      borderColor: isActive
                        ? Colors.tecnibus[300]
                        : "transparent",
                    }}
                  >
                    <View style={{ marginRight: 8, padding: 4 }}>
                      <GripVertical
                        size={18}
                        color="#9CA3AF"
                        strokeWidth={2}
                      />
                    </View>

                    <View
                      style={{
                        backgroundColor: getMarkerColor(
                          index,
                          sortedParadas.length
                        ),
                        width: 28,
                        height: 28,
                        borderRadius: 14,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Text
                        style={{
                          color: "#fff",
                          fontSize: 12,
                          fontWeight: "800",
                        }}
                      >
                        {index + 1}
                      </Text>
                    </View>

                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: "600",
                          color: "#1F2937",
                        }}
                        numberOfLines={1}
                      >
                        {item.nombre || "Sin nombre"}
                      </Text>
                      {item.hora_aprox && (
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            marginTop: 2,
                          }}
                        >
                          <Clock size={11} color="#9CA3AF" strokeWidth={2} />
                          <Text
                            style={{
                              fontSize: 11,
                              color: "#9CA3AF",
                              marginLeft: 4,
                            }}
                          >
                            {item.hora_aprox}
                          </Text>
                        </View>
                      )}
                    </View>

                    <TouchableOpacity
                      onPress={() => handleMarkerPress(item)}
                      style={{ padding: 6 }}
                    >
                      <Edit3
                        size={16}
                        color={Colors.tecnibus[600]}
                        strokeWidth={2}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => confirmDeleteParada(item)}
                      style={{ padding: 6, marginLeft: 2 }}
                    >
                      <Trash2 size={16} color="#DC2626" strokeWidth={2} />
                    </TouchableOpacity>
                  </TouchableOpacity>
                </ScaleDecorator>
              );
            }}
            contentContainerStyle={{ paddingBottom: 8 }}
            showsVerticalScrollIndicator={false}
            scrollEnabled={false}
          />
        )}
      </GestureHandlerRootView>

      {/* ParadaFormSheet */}
      <ParadaFormSheet
        visible={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingParada(null);
          setNewCoords(null);
        }}
        initialData={
          editingParada ||
          (newCoords
            ? {
                latitud: newCoords.latitude,
                longitud: newCoords.longitude,
              }
            : undefined)
        }
        rutaId={rutaId}
        nextOrden={sortedParadas.length + 1}
        onSave={handleSave}
        onDelete={editingParada ? handleDelete : undefined}
      />
    </View>
  );
}
