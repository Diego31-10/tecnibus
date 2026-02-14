import { BottomNavigation } from "@/components/layout/BottomNavigation";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { useAuth } from "@/contexts/AuthContext";
import {
  DriverQuickStats,
  MapCard,
  NextStudentHero,
  RecorridoSelector,
} from "@/features/driver";
import { Colors } from "@/lib/constants/colors";
import { useGPSTracking } from "@/lib/hooks/useGPSTracking";
import {
  getRecorridosHoy,
  type RecorridoChofer,
} from "@/lib/services/asignaciones.service";
import {
  getEstudiantesConAsistencia,
  marcarAusente,
  type EstudianteConAsistencia,
} from "@/lib/services/asistencias.service";
import {
  finalizarRecorrido,
  getEstadoRecorrido,
  guardarPolylineRuta,
  iniciarRecorrido,
} from "@/lib/services/recorridos.service";
import { getParadasByRuta, calcularRutaOptimizada, type Parada } from "@/lib/services/rutas.service";
import { getUbicacionColegio } from "@/lib/services/configuracion.service";
import { supabase } from "@/lib/services/supabase";
import type { UbicacionActual } from "@/lib/services/ubicaciones.service";
import { haptic } from "@/lib/utils/haptics";
import { useRouter } from "expo-router";
import { Bus, Play, Square } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import * as Location from "expo-location";
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function DriverHomeScreen() {
  const router = useRouter();
  const { profile } = useAuth();

  // State
  const [routeActive, setRouteActive] = useState(false);
  const [recorridos, setRecorridos] = useState<RecorridoChofer[]>([]);
  const [recorridoActual, setRecorridoActual] =
    useState<RecorridoChofer | null>(null);
  const [estudiantes, setEstudiantes] = useState<EstudianteConAsistencia[]>([]);
  const [processingStudent, setProcessingStudent] = useState<string | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [loadingRecorridos, setLoadingRecorridos] = useState(true);
  const [showRecorridoSelector, setShowRecorridoSelector] = useState(false);
  const [paradas, setParadas] = useState<Parada[]>([]);
  const [polylineCoordinates, setPolylineCoordinates] = useState<
    { latitude: number; longitude: number }[]
  >([]);
  const [ubicacionBus, setUbicacionBus] = useState<UbicacionActual | null>(
    null,
  );
  const [optimizandoRuta, setOptimizandoRuta] = useState(false);
  const [ubicacionColegio, setUbicacionColegio] = useState<{
    latitud: number;
    longitud: number;
    nombre: string;
  } | null>(null);
  const [ubicacionChofer, setUbicacionChofer] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  // GPS tracking
  const { error: errorGPS, tracking } = useGPSTracking({
    idAsignacion: recorridoActual?.id || null,
    idChofer: profile?.id || "",
    recorridoActivo: routeActive,
    intervaloSegundos: 10,
  });

  // Derived stats
  const stats = useMemo(() => {
    const completed = estudiantes.filter(
      (e) => e.estado === "presente" || e.estado === "completado",
    ).length;
    const absent = estudiantes.filter((e) => e.estado === "ausente").length;
    const total = estudiantes.length;
    const remaining = total - completed - absent;
    return { completed, absent, total, remaining };
  }, [estudiantes]);

  // Next student: first student not absent/completado, ordered by parada.orden
  const nextStudent = useMemo(() => {
    const pending = estudiantes
      .filter((e) => e.estado !== "ausente" && e.estado !== "completado")
      .sort((a, b) => (a.parada?.orden ?? 99) - (b.parada?.orden ?? 99));
    return pending[0] || null;
  }, [estudiantes]);

  // Cargar ubicación del colegio
  useEffect(() => {
    const cargarUbicacionColegio = async () => {
      try {
        const ubicacion = await getUbicacionColegio();
        setUbicacionColegio(ubicacion);
      } catch (error) {
        console.error("Error cargando ubicación del colegio:", error);
      }
    };

    cargarUbicacionColegio();
  }, []);

  // Obtener ubicación del chofer para mostrar en mapa (siempre)
  useEffect(() => {
    const obtenerUbicacionChofer = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") return;

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        setUbicacionChofer({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });

        // Actualizar cada 30 segundos
        const interval = setInterval(async () => {
          const loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          setUbicacionChofer({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          });
        }, 30000);

        return () => clearInterval(interval);
      } catch (error) {
        console.error("Error obteniendo ubicación del chofer:", error);
      }
    };

    obtenerUbicacionChofer();
  }, []);

  // Load recorridos
  const cargarRecorridos = useCallback(async () => {
    if (!profile?.id) return;
    try {
      setLoadingRecorridos(true);
      const data = await getRecorridosHoy(profile.id);
      setRecorridos(data);
      if (data.length > 0 && !recorridoActual) {
        setRecorridoActual(data[0]);
      }
    } catch (error) {
      console.error("Error cargando recorridos:", error);
      Alert.alert("Error", "No se pudieron cargar los recorridos");
    } finally {
      setLoadingRecorridos(false);
    }
  }, [profile?.id]);

  // Load students
  const cargarEstudiantes = useCallback(async () => {
    if (!profile?.id || !recorridoActual) return;
    try {
      setLoading(true);
      const data = await getEstudiantesConAsistencia(
        recorridoActual.id_ruta,
        profile.id,
      );
      setEstudiantes(data);
    } catch (error) {
      console.error("Error cargando estudiantes:", error);
      Alert.alert("Error", "No se pudieron cargar los estudiantes");
    } finally {
      setLoading(false);
    }
  }, [profile?.id, recorridoActual]);

  // Load paradas
  const cargarParadas = useCallback(async () => {
    if (!recorridoActual) return;
    try {
      const data = await getParadasByRuta(recorridoActual.id_ruta);
      setParadas(data);
    } catch (error) {
      console.error("Error cargando paradas:", error);
    }
  }, [recorridoActual]);

  // Load route state
  const cargarEstadoRecorrido = useCallback(async () => {
    if (!recorridoActual) return;
    try {
      const estado = await getEstadoRecorrido(recorridoActual.id);
      setRouteActive(estado?.activo || false);
    } catch (error) {
      console.error("Error cargando estado del recorrido:", error);
    }
  }, [recorridoActual]);

  useEffect(() => {
    cargarRecorridos();
  }, [cargarRecorridos]);

  useEffect(() => {
    if (recorridoActual) {
      cargarEstudiantes();
      cargarEstadoRecorrido();
      cargarParadas();
    }
  }, [
    recorridoActual,
    cargarEstudiantes,
    cargarEstadoRecorrido,
    cargarParadas,
  ]);

  // Realtime: attendance changes
  useEffect(() => {
    if (!recorridoActual) return;
    const channel = supabase
      .channel("asistencias-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "asistencias" },
        () => cargarEstudiantes(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [recorridoActual, cargarEstudiantes]);

  // Realtime: route state changes
  useEffect(() => {
    if (!recorridoActual) return;
    const channel = supabase
      .channel("estados-recorrido-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "estados_recorrido",
          filter: `id_asignacion=eq.${recorridoActual.id}`,
        },
        () => cargarEstadoRecorrido(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [recorridoActual, cargarEstadoRecorrido]);

  // Handlers
  const handleMarcarAusente = async () => {
    if (!profile?.id || !recorridoActual || !nextStudent) return;
    try {
      setProcessingStudent(nextStudent.id);
      haptic.medium();
      const result = await marcarAusente(
        nextStudent.id,
        recorridoActual.id_ruta,
        profile.id,
      );
      if (result) {
        await cargarEstudiantes();
        haptic.success();
      } else {
        haptic.error();
        Alert.alert("Error", "No se pudo marcar como ausente");
      }
    } catch (error) {
      console.error("Error marcando ausente:", error);
      haptic.error();
      Alert.alert("Error", "Ocurrio un error");
    } finally {
      setProcessingStudent(null);
    }
  };

  const handleNavigate = () => {
    if (!nextStudent?.parada) return;
    const paradaData = paradas.find((p) => p.id === nextStudent.parada?.id);
    if (!paradaData) return;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${paradaData.latitud},${paradaData.longitud}&travelmode=driving`;
    Linking.openURL(url);
  };

  const handleIniciarRecorrido = async () => {
    if (!recorridoActual) return;
    haptic.heavy();

    // Mostrar loading INMEDIATAMENTE
    setOptimizandoRuta(true);

    try {
      // 1. Obtener ubicación actual del chofer
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setOptimizandoRuta(false);
        Alert.alert(
          "Permisos necesarios",
          "Necesitas habilitar permisos de ubicación para iniciar el recorrido"
        );
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const ubicacionChofer = {
        lat: location.coords.latitude,
        lng: location.coords.longitude,
      };

      // 2. Obtener ubicación del colegio
      const ubicacionColegio = await getUbicacionColegio();

      // 3. Calcular ruta optimizada si hay paradas
      if (paradas.length > 0) {

        try {
          const resultado = await calcularRutaOptimizada(
            ubicacionChofer,
            paradas,
            recorridoActual.tipo_ruta,
            {
              lat: ubicacionColegio.latitud,
              lng: ubicacionColegio.longitud,
            }
          );

          if (resultado) {
            // Actualizar paradas con el orden optimizado y polyline
            setParadas(resultado.paradasOptimizadas);
            setPolylineCoordinates(resultado.polylineCoordinates);
            console.log(
              `✅ Ruta optimizada: ${resultado.paradasOptimizadas.length} paradas, ${(resultado.distanciaTotal / 1000).toFixed(1)} km, ${Math.round(resultado.duracionTotal / 60)} min`
            );

            // Guardar polyline en la BD para que el padre pueda verlo
            console.log('💾 Guardando polyline:', {
              id_asignacion: recorridoActual.id,
              cantidad_puntos: resultado.polylineCoordinates.length,
              primeros_3: resultado.polylineCoordinates.slice(0, 3),
            });
            const guardado = await guardarPolylineRuta(recorridoActual.id, resultado.polylineCoordinates);
            console.log(guardado ? '✅ Polyline guardado en BD' : '❌ Error guardando polyline');
          } else {
            console.warn("⚠️ No se pudo optimizar ruta, usando orden actual");
          }
        } catch (error) {
          console.error("Error optimizando ruta:", error);
        } finally {
          setOptimizandoRuta(false);
        }
      }

      // 4. Iniciar recorrido
      const success = await iniciarRecorrido(recorridoActual.id);
      if (success) {
        setRouteActive(true);
        haptic.success();
      } else {
        haptic.error();
        Alert.alert("Error", "No se pudo iniciar el recorrido");
      }
    } catch (error) {
      console.error("Error en handleIniciarRecorrido:", error);
      haptic.error();
      Alert.alert("Error", "Ocurrió un error al iniciar el recorrido");
    }
  };

  const handleFinalizarRecorrido = async () => {
    if (!recorridoActual) return;
    Alert.alert(
      "Finalizar Recorrido",
      "Estas seguro de que deseas finalizar el recorrido?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Finalizar",
          style: "destructive",
          onPress: async () => {
            haptic.heavy();
            const success = await finalizarRecorrido(recorridoActual.id);
            if (success) {
              setRouteActive(false);
              haptic.success();
            } else {
              haptic.error();
              Alert.alert("Error", "No se pudo finalizar el recorrido");
            }
          },
        },
      ],
    );
  };

  const headerSubtitle = recorridoActual?.nombre_ruta || "Sin recorrido";

  return (
    <View className="flex-1" style={{ backgroundColor: "#F8FAFB" }}>
      <StatusBar barStyle="light-content" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Header */}
        <DashboardHeader
          title="PANEL DE CHOFER"
          subtitle={headerSubtitle}
          icon={Bus}
          rightBadge={
            routeActive
              ? {
                  text: "EN CURSO",
                  bgColor: "rgba(255,255,255,0.25)",
                  textColor: "#ffffff",
                }
              : null
          }
        />

        {loadingRecorridos ? (
          <View className="items-center" style={{ paddingTop: 60 }}>
            <ActivityIndicator size="large" color={Colors.tecnibus[600]} />
            <Text style={{ color: "#6B7280", marginTop: 12, fontSize: 14 }}>
              Cargando recorridos...
            </Text>
          </View>
        ) : recorridos.length === 0 ? (
          <View className="items-center" style={{ paddingTop: 60 }}>
            <Bus size={56} color="#D1D5DB" strokeWidth={1.5} />
            <Text
              className="font-semibold"
              style={{ color: "#6B7280", marginTop: 16, fontSize: 16 }}
            >
              No hay recorridos hoy
            </Text>
            <Text style={{ color: "#9CA3AF", marginTop: 4, fontSize: 13 }}>
              Contacta al administrador
            </Text>
          </View>
        ) : routeActive && nextStudent ? (
          <>
            {/* Hero: next student */}
            <NextStudentHero
              studentName={`${nextStudent.nombre} ${nextStudent.apellido}`}
              address={
                nextStudent.parada
                  ? paradas.find((p) => p.id === nextStudent.parada?.id)
                      ?.direccion ||
                    nextStudent.parada.nombre ||
                    "Sin direccion"
                  : "Sin parada asignada"
              }
              parentName={undefined}
              parentPhone={undefined}
              estimatedMinutes={
                stats.remaining > 0 ? stats.remaining * 4 : undefined
              }
              isApproaching={false}
              onNavigate={handleNavigate}
              onMarkAbsent={handleMarcarAusente}
              isProcessing={processingStudent === nextStudent.id}
            />

            {/* Quick stats */}
            <DriverQuickStats
              pickedUp={stats.completed}
              total={stats.total}
              remaining={stats.remaining}
              estimatedMinutes={stats.remaining > 0 ? stats.remaining * 4 : 0}
            />

            {/* Map card */}
            <MapCard
              paradas={paradas}
              ubicacionBus={ubicacionBus}
              recorridoActivo={routeActive}
              polylineCoordinates={polylineCoordinates}
              ubicacionColegio={ubicacionColegio}
              mostrarUbicacionChofer={true}
              ubicacionChofer={ubicacionChofer}
            />

            {/* Finalize button */}
            <View style={{ marginHorizontal: 16, marginTop: 16 }}>
              <TouchableOpacity
                onPress={handleFinalizarRecorrido}
                activeOpacity={0.8}
                style={{
                  backgroundColor: "#EF4444",
                  borderRadius: 16,
                  paddingVertical: 16,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  shadowColor: "#EF4444",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.3,
                  shadowRadius: 6,
                  elevation: 4,
                }}
              >
                <Square size={18} color="#ffffff" strokeWidth={2.5} />
                <Text
                  className="font-bold"
                  style={{
                    fontSize: 15,
                    color: "#ffffff",
                    marginLeft: 8,
                  }}
                >
                  Finalizar Recorrido
                </Text>
              </TouchableOpacity>
            </View>
          </>
        ) : routeActive && !nextStudent ? (
          <>
            {/* Route active but all students done */}
            <View
              style={{
                backgroundColor: "#ffffff",
                borderRadius: 20,
                padding: 24,
                marginHorizontal: 16,
                marginTop: -20,
                alignItems: "center",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 16,
                elevation: 8,
              }}
            >
              <Text style={{ fontSize: 48, marginBottom: 12 }}>{"\u2705"}</Text>
              <Text
                className="font-bold"
                style={{ fontSize: 18, color: "#1F2937" }}
              >
                Recorrido completado
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: "#6B7280",
                  textAlign: "center",
                  marginTop: 8,
                }}
              >
                Todos los estudiantes han sido procesados
              </Text>
            </View>

            <DriverQuickStats
              pickedUp={stats.completed}
              total={stats.total}
              remaining={0}
              estimatedMinutes={0}
            />

            <MapCard
              paradas={paradas}
              ubicacionBus={ubicacionBus}
              recorridoActivo={routeActive}
              polylineCoordinates={polylineCoordinates}
              ubicacionColegio={ubicacionColegio}
              mostrarUbicacionChofer={true}
              ubicacionChofer={ubicacionChofer}
            />

            <View style={{ marginHorizontal: 16, marginTop: 16 }}>
              <TouchableOpacity
                onPress={handleFinalizarRecorrido}
                activeOpacity={0.8}
                style={{
                  backgroundColor: "#EF4444",
                  borderRadius: 16,
                  paddingVertical: 16,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  shadowColor: "#EF4444",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.3,
                  shadowRadius: 6,
                  elevation: 4,
                }}
              >
                <Square size={18} color="#ffffff" strokeWidth={2.5} />
                <Text
                  className="font-bold"
                  style={{
                    fontSize: 15,
                    color: "#ffffff",
                    marginLeft: 8,
                  }}
                >
                  Finalizar Recorrido
                </Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            {/* Route not active: start button */}
            <View
              style={{
                backgroundColor: "#ffffff",
                borderRadius: 20,
                padding: 24,
                marginHorizontal: 16,
                marginTop: -20,
                alignItems: "center",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 16,
                elevation: 8,
              }}
            >
              <Bus size={48} color={Colors.tecnibus[400]} strokeWidth={1.5} />
              <Text
                className="font-bold"
                style={{
                  fontSize: 18,
                  color: "#1F2937",
                  marginTop: 16,
                }}
              >
                {recorridoActual?.nombre_ruta || "Selecciona un recorrido"}
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: "#6B7280",
                  textAlign: "center",
                  marginTop: 4,
                }}
              >
                {recorridoActual
                  ? `${recorridoActual.hora_inicio} - ${recorridoActual.hora_fin}${recorridoActual.descripcion ? ` • ${recorridoActual.descripcion}` : ""}`
                  : "No hay recorridos asignados"}
              </Text>

              {loading ? (
                <ActivityIndicator
                  size="small"
                  color={Colors.tecnibus[600]}
                  style={{ marginTop: 12 }}
                />
              ) : (
                <Text
                  style={{
                    fontSize: 13,
                    color: "#9CA3AF",
                    marginTop: 8,
                  }}
                >
                  {estudiantes.length} estudiantes en esta ruta
                </Text>
              )}

              {recorridoActual && (
                <TouchableOpacity
                  onPress={handleIniciarRecorrido}
                  activeOpacity={0.8}
                  style={{
                    backgroundColor: Colors.tecnibus[600],
                    borderRadius: 16,
                    paddingVertical: 16,
                    paddingHorizontal: 32,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    marginTop: 20,
                    width: "100%",
                    shadowColor: Colors.tecnibus[600],
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.35,
                    shadowRadius: 6,
                    elevation: 4,
                  }}
                >
                  <Play size={20} color="#ffffff" strokeWidth={2.5} />
                  <Text
                    className="font-bold"
                    style={{
                      fontSize: 16,
                      color: "#ffffff",
                      marginLeft: 8,
                    }}
                  >
                    Iniciar Recorrido
                  </Text>
                </TouchableOpacity>
              )}

              {recorridos.length > 1 && (
                <TouchableOpacity
                  onPress={() => setShowRecorridoSelector(true)}
                  activeOpacity={0.7}
                  style={{ marginTop: 12 }}
                >
                  <Text
                    className="font-semibold"
                    style={{
                      fontSize: 14,
                      color: Colors.tecnibus[600],
                    }}
                  >
                    Cambiar recorrido
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Map preview when inactive */}
            {paradas.length > 0 && (
              <View style={{ marginTop: 16 }}>
                <MapCard
                  paradas={paradas}
                  ubicacionBus={null}
                  recorridoActivo={false}
                  ubicacionColegio={ubicacionColegio}
                  mostrarUbicacionChofer={true}
                  ubicacionChofer={ubicacionChofer}
                />
              </View>
            )}
          </>
        )}

        {/* GPS tracking indicator */}
        {routeActive && tracking && (
          <View
            className="flex-row items-center justify-center"
            style={{ marginTop: 12 }}
          >
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: "#10B981",
                marginRight: 6,
              }}
            />
            <Text style={{ fontSize: 12, color: "#6B7280" }}>GPS activo</Text>
          </View>
        )}
      </ScrollView>

      {/* Recorrido selector modal */}
      <RecorridoSelector
        visible={showRecorridoSelector}
        recorridos={recorridos}
        selectedId={recorridoActual?.id}
        onSelect={(rec) => {
          haptic.light();
          setRecorridoActual(rec);
          setShowRecorridoSelector(false);
        }}
        onClose={() => setShowRecorridoSelector(false)}
      />

      {/* GPS error alert */}
      {errorGPS && (
        <View
          style={{
            position: "absolute",
            bottom: 100,
            left: 16,
            right: 16,
            backgroundColor: "#EF4444",
            padding: 12,
            borderRadius: 16,
          }}
        >
          <Text
            className="font-semibold"
            style={{
              color: "#ffffff",
              fontSize: 13,
              textAlign: "center",
            }}
          >
            {errorGPS}
          </Text>
        </View>
      )}

      {/* Loading overlay: Optimizando ruta */}
      {optimizandoRuta && (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 999,
          }}
        >
          <View
            style={{
              backgroundColor: "#ffffff",
              borderRadius: 20,
              padding: 32,
              alignItems: "center",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 16,
              elevation: 10,
            }}
          >
            <ActivityIndicator size="large" color={Colors.tecnibus[600]} />
            <Text
              className="font-bold"
              style={{
                fontSize: 18,
                color: "#1F2937",
                marginTop: 16,
              }}
            >
              Optimizando ruta...
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: "#6B7280",
                marginTop: 8,
                textAlign: "center",
              }}
            >
              Calculando mejor recorrido{"\n"}con Google Maps
            </Text>
          </View>
        </View>
      )}

      {/* Bottom navigation */}
      <BottomNavigation
        activeTab="home"
        onHomePress={() => {}}
        onTrackingPress={() => {
          if (recorridos.length > 1) {
            setShowRecorridoSelector(true);
          }
        }}
        onSettingsPress={() => router.push("/driver/settings")}
        trackingLabel="Ruta"
      />
    </View>
  );
}
