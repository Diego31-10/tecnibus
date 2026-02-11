import { BottomNavigation } from "@/components/layout/BottomNavigation";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import RouteMap from "@/components/RouteMap";
import { useAuth } from "@/contexts/AuthContext";
import {
  DraggableBottomSheet,
  EstimatedArrivalBadge,
  ParentTrackingHero,
  RecorridoStatusBadge,
  TodayTimeline,
} from "@/features/parent";
import { Colors } from "@/lib/constants/colors";
import { toggleAsistencia } from "@/lib/services/asistencias.service";
import {
  EstudianteDelPadre,
  getMyEstudiantes,
} from "@/lib/services/padres.service";
import { getEstadoRecorridoPorRuta } from "@/lib/services/recorridos.service";
import { getParadasByRuta, type Parada } from "@/lib/services/rutas.service";
import { supabase } from "@/lib/services/supabase";
import {
  getUltimaUbicacion,
  suscribirseAUbicaciones,
  type UbicacionActual,
} from "@/lib/services/ubicaciones.service";
import { haptic } from "@/lib/utils/haptics";
import { useRouter } from "expo-router";
import { GraduationCap, Heart } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StatusBar,
  Text,
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
  }, []);

  useEffect(() => {
    if (estudianteSeleccionado?.id) {
      cargarEstadoAsistencia();
      cargarEstadoRecorrido();
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
        if (payload.payload.id_asignacion === idAsignacion) {
          setChoferEnCamino(true);
        }
      })
      .on("broadcast", { event: "recorrido_finalizado" }, (payload: any) => {
        if (payload.payload.id_asignacion === idAsignacion) {
          setChoferEnCamino(false);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [estudianteSeleccionado?.parada?.ruta?.id, idAsignacion]);

  // Cargar paradas cuando cambia la ruta del estudiante
  useEffect(() => {
    const cargarParadas = async () => {
      if (!estudianteSeleccionado?.parada?.ruta?.id) {
        setParadasRuta([]);
        return;
      }

      try {
        const paradas = await getParadasByRuta(
          estudianteSeleccionado.parada.ruta.id,
        );
        setParadasRuta(paradas);
      } catch (error) {
        console.error("Error cargando paradas:", error);
        setParadasRuta([]);
      }
    };

    cargarParadas();
  }, [estudianteSeleccionado?.parada?.ruta?.id]);

  // Cargar ubicación inicial del bus
  useEffect(() => {
    const cargarUbicacionInicial = async () => {
      if (!idAsignacion || !choferEnCamino) {
        setUbicacionBus(null);
        return;
      }

      try {
        const ubicacion = await getUltimaUbicacion(idAsignacion);
        setUbicacionBus(ubicacion);
      } catch (error) {
        console.error("Error cargando ubicación inicial:", error);
      }
    };

    cargarUbicacionInicial();
  }, [idAsignacion, choferEnCamino]);

  // Suscripción a ubicaciones en tiempo real
  useEffect(() => {
    if (!idAsignacion || !choferEnCamino) return;

    const unsubscribe = suscribirseAUbicaciones(
      idAsignacion,
      (nuevaUbicacion) => {
        setUbicacionBus(nuevaUbicacion);
      },
    );

    return () => {
      unsubscribe();
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
    if (!estudianteSeleccionado?.parada?.ruta?.id) return;

    try {
      const estado = await getEstadoRecorridoPorRuta(
        estudianteSeleccionado.parada.ruta.id,
      );
      setChoferEnCamino(estado?.activo || false);
      setIdAsignacion(estado?.id_asignacion || null);
    } catch (error) {
      console.error("Error cargando estado del recorrido:", error);
      setChoferEnCamino(false);
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
          />
        </View>
      </View>

      {/* Dashboard Header - Overlay on top of map */}
      <View
        style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 10 }}
      >
        <DashboardHeader
          title="Seguimiento Escolar"
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
