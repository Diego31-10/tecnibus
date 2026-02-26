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
import { CheckCircle2, ChevronDown, GraduationCap, Heart, UserX } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
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
  const [estudianteRecogido, setEstudianteRecogido] = useState(false);
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
  const [horaInicioRecorrido, setHoraInicioRecorrido] = useState<string | null>(null);
  const [nombreChofer, setNombreChofer] = useState<string | null>(null);
  const [idChofer, setIdChofer] = useState<string | null>(null);

  // ETAs publicados por el chofer (Google Directions, acumulados y precisos).
  // El chofer los calcula y los guarda en estados_recorrido.eta_paradas.
  // El padre los lee desde DB: carga inicial + polling 5s + Realtime como refuerzo.
  const [estimatedMinutes, setEstimatedMinutes] = useState<number | null>(null);
  const [etaColegio, setEtaColegio] = useState<number | null>(null);
  const [horaRecogida, setHoraRecogida] = useState<string | null>(null);
  const [horaLlegadaColegio, setHoraLlegadaColegio] = useState<string | null>(null);

  // Timeline dinámico con datos reales
  const timelineEvents = useMemo(() => {
    const formatHora = (isoString: string) => {
      const date = new Date(isoString);
      return date.toLocaleTimeString('es-EC', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: 'America/Guayaquil',
      });
    };

    const events: {
      id: string;
      title: string;
      subtitle: string;
      time?: string;
      status: 'completed' | 'active' | 'upcoming';
      icon: 'board' | 'departure' | 'stop';
    }[] = [];

    // 1. Inicio de recorrido
    const huboRecorrido = choferEnCamino || estudianteRecogido;
    events.push({
      id: 'inicio',
      title: 'Inicio de recorrido',
      subtitle: huboRecorrido
        ? `Salió a las ${horaInicioRecorrido ? formatHora(horaInicioRecorrido) : '--:--'}`
        : 'Esperando inicio del recorrido',
      time: horaInicioRecorrido ? formatHora(horaInicioRecorrido) : undefined,
      status: huboRecorrido ? 'completed' : 'upcoming',
      icon: 'departure',
    });

    // 2. Parada del estudiante (casa)
    const parada = estudianteSeleccionado?.parada;
    if (estudianteRecogido) {
      events.push({
        id: 'parada-casa',
        title: parada?.nombre || 'Tu parada',
        subtitle: horaRecogida
          ? `Estudiante recogido a las ${horaRecogida}`
          : 'Estudiante recogido',
        status: 'completed',
        icon: 'stop',
      });
    } else {
      events.push({
        id: 'parada-casa',
        title: parada?.nombre || 'Tu parada',
        subtitle: parada?.direccion || 'Parada asignada del estudiante',
        time: choferEnCamino && estimatedMinutes !== null ? `~${estimatedMinutes} min` : undefined,
        status: choferEnCamino ? 'active' : 'upcoming',
        icon: 'stop',
      });
    }

    // 3. Llegada al colegio
    const colegioCompletado = estudianteRecogido && !choferEnCamino;
    events.push({
      id: 'colegio',
      title: ubicacionColegio?.nombre || 'Colegio',
      subtitle: colegioCompletado
        ? (horaLlegadaColegio ? `Llegaron a las ${horaLlegadaColegio}` : 'Llegaron al colegio')
        : 'Destino final del recorrido',
      time: !colegioCompletado && choferEnCamino && etaColegio !== null ? `~${etaColegio} min` : undefined,
      status: colegioCompletado ? 'completed' : estudianteRecogido ? 'active' : 'upcoming',
      icon: 'board',
    });

    return events;
  }, [choferEnCamino, horaInicioRecorrido, estudianteSeleccionado?.parada, ubicacionColegio, estimatedMinutes, etaColegio, estudianteRecogido, horaRecogida, horaLlegadaColegio]);

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
      // Resetear estado de ruta SIEMPRE al cambiar estudiante para evitar datos viejos
      setChoferEnCamino(false);
      setIdAsignacion(null);
      setHoraInicioRecorrido(null);
      setPolylineCoordinates([]);
      setUbicacionBus(null);
      setEstimatedMinutes(null);
      setEtaColegio(null);
      setHoraRecogida(null);
      setHoraLlegadaColegio(null);

      cargarEstadoAsistencia();

      if (estudianteSeleccionado?.parada?.ruta?.id) {
        cargarEstadoRecorrido();
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
          setHoraInicioRecorrido(null);
          setPolylineCoordinates([]);
          setUbicacionBus(null);
          // Hora de llegada al colegio (capturada desde el push de geocerca_colegio)
          const hora = new Date().toLocaleTimeString('es-EC', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
            timeZone: 'America/Guayaquil',
          });
          setHoraLlegadaColegio(hora);
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

  // Polyline dinámica: solo los puntos desde la posición actual del bus hacia adelante
  const polylineRestante = useMemo(() => {
    if (!polylineCoordinates.length || !ubicacionBus) return polylineCoordinates;
    let minDist = Infinity;
    let closestIdx = 0;
    for (let i = 0; i < polylineCoordinates.length; i++) {
      const dlat = ubicacionBus.latitud - polylineCoordinates[i].latitude;
      const dlng = ubicacionBus.longitud - polylineCoordinates[i].longitude;
      const dist = dlat * dlat + dlng * dlng;
      if (dist < minDist) {
        minDist = dist;
        closestIdx = i;
      }
    }
    return polylineCoordinates.slice(closestIdx);
  }, [polylineCoordinates, ubicacionBus?.latitud, ubicacionBus?.longitud]);

  // Cargar paradas cuando cambia la ruta del estudiante
  // SOLO mostramos la parada del hijo, no todas las paradas (privacidad)
  useEffect(() => {

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
      direccion: estudianteSeleccionado.parada.direccion ?? null,
      hora_aprox: null,
      orden: estudianteSeleccionado.parada.orden || 0,
      id_ruta: estudianteSeleccionado.parada.ruta?.id || '',
    };

    console.log('✅ Mostrando solo la parada del hijo:', paradaDelHijo.nombre, 'en', latitud, longitud);
    setParadasRuta([paradaDelHijo]);
  }, [estudianteSeleccionado?.parada]);

  // Cargar nombre e id del chofer de la ruta del estudiante
  useEffect(() => {
    const idRuta = estudianteSeleccionado?.parada?.ruta?.id;
    if (!idRuta) {
      setNombreChofer(null);
      setIdChofer(null);
      return;
    }
    supabase
      .rpc('get_nombre_chofer_de_ruta', { p_id_ruta: idRuta })
      .then(({ data }) => {
        setNombreChofer(data || null);
      });
    supabase
      .rpc('get_chofer_de_ruta', { p_id_ruta: idRuta })
      .then(({ data }) => {
        setIdChofer(data || null);
      });
  }, [estudianteSeleccionado?.parada?.ruta?.id]);



  // Leer ETAs vía RPC (SECURITY DEFINER, sin problema de RLS ni segunda query)
  const refreshETAs = useCallback(async () => {
    const rutaId = estudianteSeleccionado?.parada?.ruta?.id;
    if (!rutaId || !choferEnCamino) return;
    const paradaId = estudianteSeleccionado?.parada?.id;
    const estado = await getEstadoRecorridoPorRuta(rutaId);
    if (estado?.eta_paradas) {
      const etaData = estado.eta_paradas;
      setEstimatedMinutes(paradaId != null && etaData[paradaId] != null ? etaData[paradaId] : null);
      setEtaColegio(etaData['colegio'] ?? null);
      console.log('📡 ETAs leídos vía RPC:', { parada: paradaId && etaData[paradaId], colegio: etaData['colegio'] });
    } else {
      console.log('ℹ️ refreshETAs: RPC no devolvió ETAs aún');
    }
  }, [choferEnCamino, estudianteSeleccionado?.parada?.ruta?.id, estudianteSeleccionado?.parada?.id]);

  // Polling cada 10s cuando el chofer está en camino
  useEffect(() => {
    if (!choferEnCamino || !estudianteSeleccionado?.parada?.ruta?.id) return;
    refreshETAs(); // lectura inmediata al activar
    const interval = setInterval(refreshETAs, 10000);
    return () => clearInterval(interval);
  }, [choferEnCamino, estudianteSeleccionado?.parada?.ruta?.id, refreshETAs]);

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

  // Suscripción Realtime a ubicaciones del bus
  useEffect(() => {
    if (!idAsignacion || !choferEnCamino) {
      return;
    }

    console.log(`📡 Suscribiéndose a ubicaciones Realtime para asignación: ${idAsignacion}`);
    const cleanup = suscribirseAUbicaciones(idAsignacion, (ubicacion) => {
      setUbicacionBus(ubicacion);
    });

    return cleanup;
  }, [idAsignacion, choferEnCamino]);

  // Polling de ubicación del bus cada 5s como respaldo al Realtime
  // (el Realtime puede silenciarse si la política RLS no resuelve correctamente el JOIN)
  useEffect(() => {
    if (!idAsignacion || !choferEnCamino) return;

    const poll = async () => {
      const ubicacion = await getUltimaUbicacion(idAsignacion);
      if (ubicacion) setUbicacionBus(ubicacion);
    };

    const interval = setInterval(poll, 5000);
    return () => clearInterval(interval);
  }, [idAsignacion, choferEnCamino]);

  const cargarEstadoAsistencia = async () => {
    if (!estudianteSeleccionado?.id) return;

    try {
      const hoy = new Date().toISOString().split("T")[0];
      const { data } = await supabase
        .from("asistencias")
        .select("estado, notas, updated_at")
        .eq("id_estudiante", estudianteSeleccionado.id)
        .eq("fecha", hoy)
        .single();

      const estado = data?.estado;
      const fueRecogido = estado === "completado";
      const estaAusente = estado === "ausente";
      const marcadoPorChof = data?.notas?.includes("chofer") || false;

      setEstudianteRecogido(fueRecogido);
      setIsAttending(!estaAusente && !fueRecogido);
      setMarcadoPorChofer(estaAusente && marcadoPorChof);

      if (fueRecogido && data?.updated_at) {
        const fecha = new Date(data.updated_at);
        setHoraRecogida(
          fecha.toLocaleTimeString("es-EC", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
            timeZone: "America/Guayaquil",
          })
        );
      } else {
        setHoraRecogida(null);
      }
    } catch (error) {
      setIsAttending(true);
      setEstudianteRecogido(false);
      setMarcadoPorChofer(false);
      setHoraRecogida(null);
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
      setHoraInicioRecorrido(estado?.hora_inicio || null);

      // Cargar polyline y ETAs si hay asignación activa
      if (estado?.activo && estado?.id_asignacion) {
        console.log('🔍 Cargando polyline y ETAs para asignación:', estado.id_asignacion);

        // Polyline para el mapa
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

        // ETAs vienen directamente del RPC (SECURITY DEFINER, sin segunda query)
        if (estado.eta_paradas) {
          const paradaId = estudianteSeleccionado?.parada?.id;
          const etaData = estado.eta_paradas;
          setEstimatedMinutes(paradaId != null && etaData[paradaId] != null ? etaData[paradaId] : null);
          setEtaColegio(etaData['colegio'] ?? null);
          console.log('✅ ETAs del chofer cargados:', { parada: paradaId && etaData[paradaId], colegio: etaData['colegio'] });
        } else {
          console.log('ℹ️ No hay ETAs publicados aún por el chofer');
        }
      } else {
        console.log('⚠️ No hay recorrido activo, limpiando estado');
        setHoraInicioRecorrido(null);
        setPolylineCoordinates([]);
        setUbicacionBus(null);
        setEstimatedMinutes(null);
        setEtaColegio(null);
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

    if (choferEnCamino) {
      haptic.error();
      Alert.alert(
        "Ruta en curso",
        "No puedes cambiar la asistencia una vez que la ruta ha iniciado.",
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
    if (!idAsignacion || !idChofer) {
      Alert.alert("Chat no disponible", "No hay un recorrido activo.");
      return;
    }
    haptic.light();
    router.push({
      pathname: "/parent/chat",
      params: { idAsignacion, idChofer, nombreChofer: nombreChofer ?? "Chofer" },
    });
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
            polylineCoordinates={polylineRestante}
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

        {/* Badges: recogido / ausente / en camino */}
        {estudianteRecogido ? (
          <View style={{ gap: 8 }}>
            <View
              style={{
                marginLeft: 16,
                marginTop: 8,
                alignSelf: "flex-start",
                backgroundColor: "#ECFDF5",
                borderRadius: 12,
                paddingVertical: 10,
                paddingHorizontal: 14,
                flexDirection: "row",
                alignItems: "center",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
                elevation: 4,
              }}
            >
              <CheckCircle2 size={18} color="#059669" strokeWidth={2.5} />
              <View style={{ marginLeft: 10 }}>
                <Text
                  className="font-bold"
                  style={{ fontSize: 14, color: "#065F46" }}
                >
                  Ya fue recogido
                </Text>
                <Text style={{ fontSize: 11, color: "#059669", marginTop: 2 }}>
                  {horaRecogida ? `Recogido a las ${horaRecogida}` : "La buseta lo recogió correctamente"}
                </Text>
              </View>
            </View>
            {etaColegio !== null && (
              <EstimatedArrivalBadge
                minutes={etaColegio}
                onSchedule={choferEnCamino}
                label="al colegio"
              />
            )}
          </View>
        ) : !isAttending ? (
          <View
            style={{
              marginLeft: 16,
              marginTop: 8,
              alignSelf: "flex-start",
              backgroundColor: "#FEF2F2",
              borderRadius: 12,
              paddingVertical: 10,
              paddingHorizontal: 14,
              flexDirection: "row",
              alignItems: "center",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 4,
            }}
          >
            <UserX size={18} color="#DC2626" strokeWidth={2.5} />
            <View style={{ marginLeft: 10 }}>
              <Text
                className="font-bold"
                style={{ fontSize: 14, color: "#991B1B" }}
              >
                No sera recogido hoy
              </Text>
              <Text style={{ fontSize: 11, color: "#DC2626", marginTop: 2 }}>
                {marcadoPorChofer
                  ? "Marcado ausente por el chofer"
                  : "Marcado ausente por ti"}
              </Text>
            </View>
          </View>
        ) : (
          <>
            <RecorridoStatusBadge isActive={choferEnCamino} />
            {choferEnCamino && estimatedMinutes !== null && (
              <EstimatedArrivalBadge
                minutes={estimatedMinutes}
                onSchedule={choferEnCamino}
                label="a tu parada"
              />
            )}
          </>
        )}

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
            driverName={nombreChofer || "—"}
            isOnline={choferEnCamino}
            isAttending={isAttending}
            isRecogido={estudianteRecogido}
            routeStarted={choferEnCamino}
            onChatPress={handleChatDriver}
            onNotifyAbsencePress={handleToggleAttendance}
          />

          {/* Timeline / ausencia */}
          {isAttending || estudianteRecogido ? (
            <TodayTimeline events={timelineEvents} isLive={choferEnCamino} />
          ) : (
            <View
              style={{
                backgroundColor: "#ffffff",
                borderRadius: 20,
                padding: 24,
                marginHorizontal: 16,
                marginBottom: 20,
                alignItems: "center",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.06,
                shadowRadius: 12,
                elevation: 4,
              }}
            >
              <View
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 32,
                  backgroundColor: "#FEF2F2",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 12,
                }}
              >
                <UserX size={32} color="#DC2626" strokeWidth={1.5} />
              </View>
              <Text
                className="font-bold"
                style={{ fontSize: 17, color: "#1F2937" }}
              >
                Estudiante ausente hoy
              </Text>
              <Text
                style={{
                  fontSize: 13,
                  color: "#6B7280",
                  textAlign: "center",
                  marginTop: 8,
                  lineHeight: 18,
                }}
              >
                {estudianteSeleccionado?.nombre || "El estudiante"} no sera
                recogido por la buseta hoy.{"\n"}Si cambias de opinion, puedes
                reactivar la asistencia arriba.
              </Text>
            </View>
          )}
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
        onMiddlePress={handleTracking}
        onSettingsPress={handleSettings}
      />
    </View>
  );
}
