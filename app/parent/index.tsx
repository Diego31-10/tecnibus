import { BottomNavigation } from "@/components/layout/BottomNavigation";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import RouteMap from "@/components/RouteMap";
import { useAuth } from "@/contexts/AuthContext";
import {
  DraggableBottomSheet,
  EstimatedArrivalBadge,
  ParentTrackingHero,
  RecorridoStatusBadge,
  StudentSelector,
  TodayTimeline,
} from "@/features/parent";
import { Colors } from "@/lib/constants/colors";
import { toggleAsistencia } from "@/lib/services/asistencias.service";
import { getUbicacionColegio } from "@/lib/services/configuracion.service";
import {
  EstudianteDelPadre,
  getMyEstudiantes,
} from "@/lib/services/padres.service";
import { getEstadoRecorridoPorRuta } from "@/lib/services/recorridos.service";
import { type Parada } from "@/lib/services/rutas.service";
import { supabase } from "@/lib/services/supabase";
import {
  getUltimaUbicacion,
  suscribirseAUbicaciones,
  type UbicacionActual,
} from "@/lib/services/ubicaciones.service";
import { haptic } from "@/lib/utils/haptics";
import { useRouter } from "expo-router";
import { ChevronDown, GraduationCap, Heart } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function ParentHomeScreen() {
  const router = useRouter();
  const { profile } = useAuth();

  // Estados
  const [loading, setLoading] = useState(true);
  const [estudiantes, setEstudiantes] = useState<EstudianteDelPadre[]>([]);
  const [estudianteSeleccionado, setEstudianteSeleccionado] =
    useState<EstudianteDelPadre | null>(null);
  const [isAttending, setIsAttending] = useState(true);
  const [processingAttendance, setProcessingAttendance] = useState(false);
  const [marcadoPorChofer, setMarcadoPorChofer] = useState(false);
  const [choferEnCamino, setChoferEnCamino] = useState(false);
  const [idAsignacion, setIdAsignacion] = useState<string | null>(null);
  const [paradasRuta, setParadasRuta] = useState<Parada[]>([]);
  const [ubicacionBus, setUbicacionBus] = useState<UbicacionActual | null>(
    null,
  );
  const [isSheetExpanded, setIsSheetExpanded] = useState(false);
  const [showStudentSelector, setShowStudentSelector] = useState(false);
  const [ubicacionColegio, setUbicacionColegio] = useState<{
    latitud: number;
    longitud: number;
    nombre: string;
  } | null>(null);
  const [polylineCoordinates, setPolylineCoordinates] = useState<
    { latitude: number; longitude: number }[]
  >([]);

  // Datos temporales
  const estimatedMinutes = 8;

  // Timeline events
  const timelineEvents = [
    {
      id: "1",
      title: "Currently On Board",
      subtitle: "Departed from school at 3:15 PM",
      status: "active" as const,
      icon: "board" as const,
    },
    {
      id: "2",
      title: "School Departure",
      subtitle: "Checked out by Teacher at 3:10 PM",
      status: "completed" as const,
      icon: "departure" as const,
    },
    {
      id: "3",
      title: "Stop 1: Main Street",
      subtitle: "Parada intermedia",
      time: "4:20 PM",
      status: "upcoming" as const,
      icon: "stop" as const,
    },
    {
      id: "4",
      title: "Stop 2: Park Avenue",
      subtitle: "Parada intermedia",
      time: "4:30 PM",
      status: "upcoming" as const,
      icon: "stop" as const,
    },
    {
      id: "5",
      title: "Stop 3: Oak Boulevard",
      subtitle: "Parada intermedia",
      time: "4:37 PM",
      status: "upcoming" as const,
      icon: "stop" as const,
    },
    {
      id: "6",
      title: "Your Stop: 124 Maple St.",
      subtitle: "Estimated Drop-off",
      time: "4:43 PM",
      status: "upcoming" as const,
      icon: "stop" as const,
    },
    {
      id: "7",
      title: "Final Stop: Cedar Lane",
      subtitle: "Última parada de la ruta",
      time: "4:50 PM",
      status: "upcoming" as const,
      icon: "stop" as const,
    },
  ];

  useEffect(() => {
    loadEstudiantes();
    cargarUbicacionColegio();
  }, []);

  const cargarUbicacionColegio = async () => {
    try {
      const ubicacion = await getUbicacionColegio();
      setUbicacionColegio(ubicacion);
    } catch (error) {
      console.error('Error cargando ubicación del colegio:', error);
    }
  };

  useEffect(() => {
    if (estudianteSeleccionado?.id) {
      cargarEstadoAsistencia();

      // Solo cargar recorrido si el estudiante tiene ruta asignada
      if (estudianteSeleccionado?.parada?.ruta?.id) {
        cargarEstadoRecorrido();
      } else {
        // Si no tiene ruta, limpiar todo
        console.log('⚠️ Estudiante sin ruta asignada, limpiando estado');
        setChoferEnCamino(false);
        setIdAsignacion(null);
        setPolylineCoordinates([]);
        setUbicacionBus(null);
      }
    }
  }, [estudianteSeleccionado?.id]);

  // Suscripción en tiempo real a cambios en asistencias
  useEffect(() => {
    if (!estudianteSeleccionado?.id) return;

    const channel = supabase
      .channel("asistencias-padre-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "asistencias",
          filter: `id_estudiante=eq.${estudianteSeleccionado.id}`,
        },
        () => cargarEstadoAsistencia(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [estudianteSeleccionado?.id]);

  // Suscripción a broadcast de estados de recorrido
  useEffect(() => {
    if (!estudianteSeleccionado?.parada?.ruta?.id) return;

    const channel = supabase
      .channel("recorrido-status")
      .on("broadcast", { event: "recorrido_iniciado" }, (payload: any) => {
        console.log('📡 Broadcast recorrido_iniciado recibido:', payload.payload);
        if (payload.payload.id_asignacion === idAsignacion) {
          setChoferEnCamino(true);
          // Recargar estado completo para obtener el polyline actualizado
          cargarEstadoRecorrido();
        }
      })
      .on("broadcast", { event: "recorrido_finalizado" }, (payload: any) => {
        console.log('📡 Broadcast recorrido_finalizado recibido:', payload.payload);
        if (payload.payload.id_asignacion === idAsignacion) {
          console.log('🧹 Limpiando estado de recorrido finalizado');
          setChoferEnCamino(false);
          setPolylineCoordinates([]); // Limpiar polyline
          setUbicacionBus(null); // Limpiar ubicación del bus
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [estudianteSeleccionado?.parada?.ruta?.id, idAsignacion]);

  // Suscripción directa a cambios en estados_recorrido para garantizar sincronización
  useEffect(() => {
    if (!estudianteSeleccionado?.parada?.ruta?.id) return;

    const channel = supabase
      .channel("estados-recorrido-padre")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "estados_recorrido",
          filter: `id_ruta=eq.${estudianteSeleccionado.parada.ruta.id}`,
        },
        () => {
          // Recargar el estado del recorrido cuando hay cambios
          cargarEstadoRecorrido();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [estudianteSeleccionado?.parada?.ruta?.id]);

  // DEBUG: Monitorear cambios en polylineCoordinates
  useEffect(() => {
    console.log('🔄 Polyline actualizado:', {
      cantidad: polylineCoordinates.length,
      primeros3: polylineCoordinates.slice(0, 3),
    });
  }, [polylineCoordinates]);

  // Cargar paradas cuando cambia la ruta del estudiante
  // SOLO mostramos la parada del hijo, no todas las paradas (privacidad)
  useEffect(() => {
    console.log('🔍 Configurando parada del estudiante:', {
      tieneEstudiante: !!estudianteSeleccionado,
      tieneParada: !!estudianteSeleccionado?.parada,
    });

    if (!estudianteSeleccionado?.parada) {
      console.log('⚠️ No hay parada para mostrar');
      setParadasRuta([]);
      return;
    }

    // Solo mostrar la parada del hijo (no todas las paradas de la ruta)
    // Convertir a números para evitar NaN
    const latitud = typeof estudianteSeleccionado.parada.latitud === 'string'
      ? parseFloat(estudianteSeleccionado.parada.latitud)
      : estudianteSeleccionado.parada.latitud;

    const longitud = typeof estudianteSeleccionado.parada.longitud === 'string'
      ? parseFloat(estudianteSeleccionado.parada.longitud)
      : estudianteSeleccionado.parada.longitud;

    // Validar que sean números válidos
    if (isNaN(latitud) || isNaN(longitud)) {
      console.error('❌ Coordenadas inválidas para la parada:', {
        latitud: estudianteSeleccionado.parada.latitud,
        longitud: estudianteSeleccionado.parada.longitud,
      });
      setParadasRuta([]);
      return;
    }

    const paradaDelHijo: Parada = {
      id: estudianteSeleccionado.parada.id,
      nombre: estudianteSeleccionado.parada.nombre || 'Mi parada',
      latitud,
      longitud,
      direccion: estudianteSeleccionado.parada.direccion,
      orden: estudianteSeleccionado.parada.orden || 0,
      id_ruta: estudianteSeleccionado.parada.ruta?.id || '',
    };

    console.log('✅ Mostrando solo la parada del hijo:', paradaDelHijo.nombre, 'en', latitud, longitud);
    setParadasRuta([paradaDelHijo]);
  }, [estudianteSeleccionado?.parada]);

  // Cargar ubicación inicial del bus
  useEffect(() => {
    const cargarUbicacionInicial = async () => {
      console.log('🔍 Cargando ubicación inicial del bus:', {
        tieneAsignacion: !!idAsignacion,
        choferEnCamino,
        idAsignacion,
      });

      if (!idAsignacion || !choferEnCamino) {
        console.log('⚠️ No se puede cargar ubicación: falta asignación o chofer no está en camino');
        setUbicacionBus(null);
        return;
      }

      try {
        console.log(`📍 Obteniendo última ubicación para asignación: ${idAsignacion}`);
        const ubicacion = await getUltimaUbicacion(idAsignacion);
        console.log('✅ Ubicación inicial obtenida:', ubicacion);
        setUbicacionBus(ubicacion);
      } catch (error) {
        console.error("❌ Error cargando ubicación inicial:", error);
      }
    };

    cargarUbicacionInicial();
  }, [idAsignacion, choferEnCamino]);

  // Polling de ubicaciones (más confiable que Realtime con RLS)
  useEffect(() => {
    console.log('🔍 Configurando polling de ubicaciones:', {
      tieneAsignacion: !!idAsignacion,
      choferEnCamino,
      idAsignacion,
    });

    if (!idAsignacion || !choferEnCamino) {
      console.log('⚠️ No se hace polling: falta asignación o chofer no está en camino');
      return;
    }

    console.log(`📡 Iniciando polling de ubicaciones cada 5s para asignación: ${idAsignacion}`);

    // Polling cada 5 segundos
    const intervalo = setInterval(async () => {
      try {
        console.log('🔄 Polling: obteniendo ubicación actualizada...');
        const ubicacion = await getUltimaUbicacion(idAsignacion);
        if (ubicacion) {
          console.log('✅ Polling: ubicación obtenida:', ubicacion);
          setUbicacionBus(ubicacion);
        } else {
          console.log('⚠️ Polling: no se obtuvo ubicación');
        }
      } catch (error) {
        console.error('❌ Error en polling de ubicación:', error);
      }
    }, 5000); // 5 segundos

    return () => {
      console.log('🔕 Deteniendo polling de ubicaciones');
      clearInterval(intervalo);
    };
  }, [idAsignacion, choferEnCamino]);

  const cargarEstadoAsistencia = async () => {
    if (!estudianteSeleccionado?.id) return;

    try {
      const hoy = new Date().toISOString().split("T")[0];
      const { data } = await supabase
        .from("asistencias")
        .select("estado, notas")
        .eq("id_estudiante", estudianteSeleccionado.id)
        .eq("fecha", hoy)
        .single();

      const estaPresente = data?.estado === "presente" || !data;
      const marcadoPorChof = data?.notas?.includes("chofer") || false;

      setIsAttending(estaPresente);
      setMarcadoPorChofer(!estaPresente && marcadoPorChof);
    } catch (error) {
      setIsAttending(true);
      setMarcadoPorChofer(false);
    }
  };

  const cargarEstadoRecorrido = async () => {
    if (!estudianteSeleccionado?.parada?.ruta?.id) {
      console.log('⚠️ No hay ruta asignada al estudiante');
      return;
    }

    try {
      const estado = await getEstadoRecorridoPorRuta(
        estudianteSeleccionado.parada.ruta.id,
      );

      const recorridoActivo = estado?.activo || false;
      setChoferEnCamino(recorridoActivo);
      setIdAsignacion(estado?.id_asignacion || null);

      // Cargar polyline si hay asignación activa usando RPC (evita recursión RLS)
      if (estado?.activo && estado?.id_asignacion) {
        console.log('🔍 Cargando polyline para asignación:', estado.id_asignacion);
        const { data: polyline, error: polylineError } = await supabase
          .rpc('get_polyline_asignacion', {
            p_id_asignacion: estado.id_asignacion,
          });

        console.log('📡 Respuesta de polyline:', { polyline, polylineError });

        if (polyline && Array.isArray(polyline)) {
          setPolylineCoordinates(polyline);
          console.log('✅ Polyline cargado desde BD:', polyline.length, 'puntos');
        } else {
          console.log('⚠️ No hay polyline guardado para esta asignación');
          setPolylineCoordinates([]);
        }
      } else {
        console.log('⚠️ No hay recorrido activo, limpiando estado');
        setPolylineCoordinates([]);
        setUbicacionBus(null);
      }
    } catch (error) {
      console.error("Error cargando estado del recorrido:", error);
      setChoferEnCamino(false);
      setPolylineCoordinates([]);
      setUbicacionBus(null);
    }
  };

  const loadEstudiantes = async () => {
    setLoading(true);
    const data = await getMyEstudiantes();
    setEstudiantes(data);

    if (data.length > 0) {
      setEstudianteSeleccionado(data[0]);
    }

    setLoading(false);
  };

  const handleToggleAttendance = async () => {
    if (
      !estudianteSeleccionado?.id ||
      !estudianteSeleccionado?.parada?.ruta?.id
    ) {
      Alert.alert(
        "Error",
        "No se puede marcar asistencia sin estudiante o ruta asignada",
      );
      return;
    }

    try {
      setProcessingAttendance(true);
      haptic.medium();

      const marcarComoAusente = isAttending;

      const success = await toggleAsistencia(
        estudianteSeleccionado.id,
        estudianteSeleccionado.parada.ruta.id,
        marcarComoAusente,
      );

      if (success) {
        setIsAttending(!isAttending);
        haptic.success();

        if (marcarComoAusente) {
          Alert.alert(
            "Ausencia registrada",
            "El chofer ha sido notificado que el estudiante no asistirá hoy.",
          );
        } else {
          Alert.alert(
            "Asistencia actualizada",
            "El estudiante volverá a ser recogido normalmente.",
          );
        }
      } else {
        haptic.error();
        Alert.alert(
          "Error",
          "No se pudo actualizar la asistencia. Intenta nuevamente.",
        );
      }
    } catch (error) {
      console.error("Error toggling attendance:", error);
      haptic.error();
      Alert.alert("Error", "Ocurrió un error al actualizar la asistencia");
    } finally {
      setProcessingAttendance(false);
    }
  };

  const handleSheetSnapChange = (snapPoint: number) => {
    // El sheet está expandido si está en el maxSnapPoint (0.45)
    setIsSheetExpanded(snapPoint >= 0.45);
  };

  const handleTracking = () => {
    haptic.light();
    console.log("Navegar a tracking");
  };

  const handleSettings = () => {
    haptic.light();
    router.push("/parent/settings");
  };

  const handleSelectStudent = (estudiante: EstudianteDelPadre) => {
    haptic.light();
    setEstudianteSeleccionado(estudiante);
    setShowStudentSelector(false);
  };

  const handleChatDriver = () => {
    haptic.light();
    Alert.alert("Chat Chofer", "Funcionalidad en desarrollo");
  };

  // Loading state
  if (loading) {
    return (
      <View
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: Colors.tecnibus[50] }}
      >
        <ActivityIndicator size="large" color={Colors.tecnibus[600]} />
        <Text className="text-gray-500 mt-4">Cargando información...</Text>
      </View>
    );
  }

  // Empty state
  if (estudiantes.length === 0) {
    return (
      <View
        className="flex-1 items-center justify-center px-6"
        style={{ backgroundColor: Colors.tecnibus[50] }}
      >
        <View className="bg-gray-100 p-4 rounded-full mb-4">
          <GraduationCap size={48} color="#9ca3af" strokeWidth={2} />
        </View>
        <Text className="text-gray-800 text-xl font-bold mb-2 font-calsans">
          Sin estudiantes asignados
        </Text>
        <Text className="text-gray-500 text-center">
          Aún no tienes estudiantes vinculados a tu cuenta. Contacta al
          administrador para asignar estudiantes.
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#000000" }}>
      <StatusBar
        backgroundColor={Colors.tecnibus[600]}
        barStyle="light-content"
      />

      {/* Map Background - FULL SCREEN (behind everything) */}
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 0,
        }}
      >
        <View style={{ flex: 1 }}>
          <RouteMap
            paradas={paradasRuta}
            ubicacionBus={ubicacionBus}
            recorridoActivo={choferEnCamino}
            ubicacionColegio={ubicacionColegio}
            showsUserLocation={false}
            polylineCoordinates={polylineCoordinates}
          />
        </View>
      </View>

      {/* Dashboard Header - Overlay on top of map */}
      <View
        style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 10 }}
      >
        <DashboardHeader
          title="PANEL DE PADRE"
          subtitle={`¡Hola ${profile?.nombre}!`}
          gradientColors={[
            Colors.tecnibus[600],
            Colors.tecnibus[500],
            Colors.tecnibus[400],
          ]}
          icon={Heart}
        />

        {/* Recorrido Status Badge - Below Header */}
        <RecorridoStatusBadge isActive={choferEnCamino} />

        {/* Estimated Arrival Badge - Below Status Badge */}
        <EstimatedArrivalBadge
          minutes={estimatedMinutes}
          onSchedule={choferEnCamino}
        />

        {/* Student Selector Chip - Solo si hay más de 1 estudiante */}
        {estudiantes.length > 1 && (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              haptic.light();
              setShowStudentSelector(true);
            }}
            style={{
              marginHorizontal: 16,
              marginTop: 8,
              alignSelf: "flex-start",
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "rgba(255, 255, 255, 0.95)",
              borderRadius: 12,
              paddingVertical: 8,
              paddingHorizontal: 12,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
            }}
          >
            <GraduationCap
              size={16}
              color={Colors.tecnibus[600]}
              strokeWidth={2.5}
            />
            <Text
              style={{
                fontSize: 13,
                fontWeight: "600",
                color: Colors.tecnibus[800],
                marginLeft: 6,
              }}
            >
              {estudianteSeleccionado?.nombre || "Seleccionar"}
            </Text>
            <ChevronDown
              size={14}
              color={Colors.tecnibus[500]}
              strokeWidth={2.5}
              style={{ marginLeft: 4 }}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Draggable Bottom Sheet */}
      <DraggableBottomSheet
        initialSnapPoint={0.15}
        minSnapPoint={0.15}
        maxSnapPoint={0.52}
        onSnapPointChange={handleSheetSnapChange}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          style={{ flex: 1 }}
          scrollEnabled={isSheetExpanded}
          nestedScrollEnabled={true}
          bounces={isSheetExpanded}
          scrollEventThrottle={16}
          contentContainerStyle={{ paddingBottom: 430 }}
        >
          {/* Hero Card */}
          <ParentTrackingHero
            studentName={estudianteSeleccionado?.nombreCompleto || "Estudiante"}
            busNumber={`Bus ${estudianteSeleccionado?.parada?.ruta?.nombre || "N/A"}`}
            driverName="Michael Scott"
            isOnline={choferEnCamino}
            isAttending={isAttending}
            onChatPress={handleChatDriver}
            onNotifyAbsencePress={handleToggleAttendance}
          />

          {/* Timeline */}
          <TodayTimeline events={timelineEvents} isLive={choferEnCamino} />
        </ScrollView>
      </DraggableBottomSheet>

      {/* Student Selector Modal */}
      <StudentSelector
        visible={showStudentSelector}
        estudiantes={estudiantes}
        selectedId={estudianteSeleccionado?.id}
        onSelect={handleSelectStudent}
        onClose={() => setShowStudentSelector(false)}
      />

      {/* Bottom Navigation - Always on top */}
      <BottomNavigation
        activeTab="home"
        activeColor={Colors.tecnibus[600]}
        onHomePress={() => {}}
        onTrackingPress={handleTracking}
        onSettingsPress={handleSettings}
      />
    </View>
  );
}
