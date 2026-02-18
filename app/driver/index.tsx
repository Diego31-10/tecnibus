import { BottomNavigation } from "@/components/layout/BottomNavigation";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { useAuth } from "@/contexts/AuthContext";
import {
  DriverQuickStats,
  EstudianteActualPanel,
  MapCard,
  NextStudentHero,
  RecorridoSelector,
} from "@/features/driver";
import { Colors } from "@/lib/constants/colors";
import { useGeofencing } from "@/lib/hooks/useGeofencing";
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
import {
  calcularDistancia,
  calcularETAsRuta,
  inicializarEstadosGeocercas,
  marcarEstudianteCompletado,
} from "@/lib/services/geocercas.service";
import { sendPushToParents } from "@/lib/services/notifications.service";
import { getParadasByRuta, calcularRutaOptimizada, type Parada } from "@/lib/services/rutas.service";
import { getUbicacionColegio } from "@/lib/services/configuracion.service";
import { supabase } from "@/lib/services/supabase";
import type { UbicacionActual } from "@/lib/services/ubicaciones.service";
import { haptic } from "@/lib/utils/haptics";
import { useRouter } from "expo-router";
import { Bus, CheckCircle2, MapPinOff, Play, Square } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
    speed: number | null;
  } | null>(null);
  const [horaInicioRecorrido, setHoraInicioRecorrido] = useState<string | null>(null);

  // GPS tracking
  const { error: errorGPS, tracking } = useGPSTracking({
    idAsignacion: recorridoActual?.id || null,
    idChofer: profile?.id || "",
    recorridoActivo: routeActive,
    intervaloSegundos: 10,
  });

  // Geofencing
  const {
    estudianteActual: estudianteGeocerca,
    dentroDeZona,
    distanciaMetros,
    marcarCompletadoManual,
  } = useGeofencing({
    idAsignacion: recorridoActual?.id ?? null,
    idChofer: profile?.id || "",
    recorridoActivo: routeActive,
    ubicacionActual: ubicacionChofer,
    radioMetros: 100,
  });

  // Ref para evitar notificaciones push duplicadas por el mismo estudiante
  const lastPushStudentRef = useRef<string | null>(null);

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

  // IDs de paradas donde TODOS los estudiantes están ausentes
  const paradasAusentesIds = useMemo(() => {
    if (estudiantes.length === 0) return new Set<string>();

    // Para cada parada: contar activos vs ausentes
    const activos = new Map<string, number>();
    const totales = new Map<string, number>();

    for (const e of estudiantes) {
      if (!e.parada?.id) continue;
      totales.set(e.parada.id, (totales.get(e.parada.id) || 0) + 1);
      if (e.estado !== "ausente") {
        activos.set(e.parada.id, (activos.get(e.parada.id) || 0) + 1);
      }
    }

    const ausentes = new Set<string>();
    for (const [paradaId, total] of totales) {
      if ((activos.get(paradaId) || 0) === 0 && total > 0) {
        ausentes.add(paradaId);
      }
    }
    return ausentes;
  }, [estudiantes]);

  // Paradas filtradas: sin paradas donde todos los estudiantes están ausentes
  const paradasVisibles = useMemo(() => {
    if (paradasAusentesIds.size === 0) return paradas;
    return paradas.filter((p) => !paradasAusentesIds.has(p.id));
  }, [paradas, paradasAusentesIds]);

  // Parada más cercana por GPS (para el card "en camino")
  const paradaMasCercana = useMemo(() => {
    if (!ubicacionChofer || paradasVisibles.length === 0 || !routeActive) return null;

    // Solo considerar paradas que tienen estudiantes pendientes
    const paradasPendientes = paradasVisibles.filter((p) => {
      // Verificar que al menos un estudiante de esta parada no está ausente/completado
      return estudiantes.some(
        (e) =>
          e.parada?.id === p.id &&
          e.estado !== "ausente" &&
          e.estado !== "completado",
      );
    });

    if (paradasPendientes.length === 0) return null;

    let menor = Infinity;
    let cercana: (typeof paradasPendientes)[0] | null = null;

    for (const p of paradasPendientes) {
      const dist = calcularDistancia(
        ubicacionChofer.latitude,
        ubicacionChofer.longitude,
        p.latitud,
        p.longitud,
      );
      if (dist < menor) {
        menor = dist;
        cercana = p;
      }
    }

    return cercana ? { parada: cercana, distanciaMetros: menor } : null;
  }, [ubicacionChofer, paradasVisibles, estudiantes, routeActive]);

  // ETAs acumulados por parada + fin de ruta (una sola llamada, consistentes entre sí)
  // Ruta: chofer → parada1 → parada2 → ... → colegio
  const [etasPorParada, setEtasPorParada] = useState<Record<string, number>>({});
  const [etaFinRuta, setEtaFinRuta] = useState<number | null>(null);

  useEffect(() => {
    if (!ubicacionChofer || !routeActive) {
      setEtasPorParada({});
      setEtaFinRuta(null);
      return;
    }
    // Paradas pendientes ordenadas por distancia desde el chofer (más cercana primero).
    // No usar `orden` de DB porque refleja el orden de ingreso, no la ruta optimizada.
    const paradasPendientes = paradasVisibles.filter((p) =>
      estudiantes.some(
        (e) => e.parada?.id === p.id && e.estado !== 'ausente' && e.estado !== 'completado',
      ),
    ).sort((a, b) => {
      const distA = calcularDistancia(
        ubicacionChofer.latitude, ubicacionChofer.longitude,
        Number(a.latitud), Number(a.longitud),
      );
      const distB = calcularDistancia(
        ubicacionChofer.latitude, ubicacionChofer.longitude,
        Number(b.latitud), Number(b.longitud),
      );
      return distA - distB;
    });

    if (paradasPendientes.length === 0 && !ubicacionColegio) {
      setEtasPorParada({});
      setEtaFinRuta(null);
      return;
    }

    // Cache key basado en IDs de paradas pendientes para detectar cambios
    const cacheKey = `chofer-${paradasPendientes.map(p => p.id).join(',')}`;

    calcularETAsRuta(
      ubicacionChofer.latitude,
      ubicacionChofer.longitude,
      paradasPendientes,
      ubicacionColegio ? { latitud: ubicacionColegio.latitud, longitud: ubicacionColegio.longitud } : null,
      cacheKey,
    ).then(({ porParada, destinoFinal }) => {
      setEtasPorParada(porParada);
      setEtaFinRuta(destinoFinal);

      // Publicar ETAs en DB para que los padres los lean directamente
      // Formato: { "parada_uuid": minutos, ..., "colegio": minutos }
      if (recorridoActual?.id) {
        supabase
          .from('estados_recorrido')
          .update({ eta_paradas: { ...porParada, colegio: destinoFinal } })
          .eq('id_asignacion', recorridoActual.id)
          .then(({ error }) => {
            if (error) {
              console.error('❌ Error publicando ETAs en DB:', error.message);
            } else {
              console.log('✅ ETAs publicados en DB:', { paradas: Object.keys(porParada).length, colegio: destinoFinal });
            }
          });
      }
    });
  }, [
    ubicacionChofer?.latitude,
    ubicacionChofer?.longitude,
    routeActive,
    // Recalcular cuando cambia el conjunto de paradas pendientes
    // eslint-disable-next-line react-hooks/exhaustive-deps
    paradasVisibles.map(p => p.id).join(','),
    estudiantes.map(e => e.estado).join(','),
    ubicacionColegio?.latitud,
    ubicacionColegio?.longitud,
    recorridoActual?.id,
  ]);

  // ETA a la próxima parada (derivado de etasPorParada, sin llamada extra)
  const etaProximaParada = paradaMasCercana
    ? (etasPorParada[paradaMasCercana.parada.id] ?? null)
    : null;

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

  // Obtener ubicación del chofer para mostrar en mapa
  // 5s cuando routeActive (geocerca necesita precisión), 30s cuando inactivo
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    const obtenerUbicacionChofer = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") return;

        const location = await Location.getCurrentPositionAsync({
          accuracy: routeActive ? Location.Accuracy.High : Location.Accuracy.Balanced,
        });

        setUbicacionChofer({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          speed: location.coords.speed != null ? location.coords.speed * 3.6 : null,
        });

        const intervalo = routeActive ? 5000 : 30000;
        interval = setInterval(async () => {
          try {
            const loc = await Location.getCurrentPositionAsync({
              accuracy: routeActive ? Location.Accuracy.High : Location.Accuracy.Balanced,
            });
            setUbicacionChofer({
              latitude: loc.coords.latitude,
              longitude: loc.coords.longitude,
              speed: loc.coords.speed != null ? loc.coords.speed * 3.6 : null,
            });
          } catch (err) {
            console.error("Error actualizando ubicación:", err);
          }
        }, intervalo);
      } catch (error) {
        console.error("Error obteniendo ubicación del chofer:", error);
      }
    };

    obtenerUbicacionChofer();

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [routeActive]);

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
      setHoraInicioRecorrido(estado?.hora_inicio || null);
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

  // Polling fallback: recargar estudiantes cada 15s cuando ruta activa
  // (por si realtime no captura cambios del padre)
  useEffect(() => {
    if (!routeActive || !recorridoActual) return;
    const interval = setInterval(() => {
      cargarEstudiantes();
    }, 15000);
    return () => clearInterval(interval);
  }, [routeActive, recorridoActual, cargarEstudiantes]);

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

  // Notificación push al padre cuando entramos a geocerca
  useEffect(() => {
    if (
      !dentroDeZona ||
      !estudianteGeocerca ||
      !recorridoActual
    ) return;

    // Evitar duplicados por el mismo estudiante
    if (lastPushStudentRef.current === estudianteGeocerca.id_estudiante) return;
    lastPushStudentRef.current = estudianteGeocerca.id_estudiante;

    sendPushToParents(
      recorridoActual.id,
      "La buseta esta cerca",
      `La buseta se acerca a ${estudianteGeocerca.parada_nombre || "la parada"}. ${estudianteGeocerca.nombreCompleto} sera recogido pronto.`,
      {
        tipo: "geocerca_entrada",
        id_estudiante: estudianteGeocerca.id_estudiante,
      }
    ).catch((err) => {
      console.warn("Error enviando push de geocerca:", err);
    });
  }, [dentroDeZona, estudianteGeocerca?.id_estudiante, recorridoActual?.id]);

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

  const handleMarcarAusenteGeocerca = async () => {
    if (!profile?.id || !recorridoActual || !estudianteGeocerca) return;
    try {
      setProcessingStudent(estudianteGeocerca.id_estudiante);
      haptic.medium();

      // 1. Marcar asistencia como ausente
      const result = await marcarAusente(
        estudianteGeocerca.id_estudiante,
        recorridoActual.id_ruta,
        profile.id,
      );

      if (result) {
        // 2. Actualizar estado de geocerca a completado
        await marcarEstudianteCompletado(
          recorridoActual.id,
          estudianteGeocerca.id_estudiante,
          profile.id,
          "ausente",
        );

        // 3. Cargar siguiente estudiante en el hook
        await marcarCompletadoManual();

        // 4. Recargar lista de estudiantes para actualizar stats
        await cargarEstudiantes();

        // Reset ref para permitir push al siguiente estudiante
        lastPushStudentRef.current = null;

        haptic.success();
      } else {
        haptic.error();
        Alert.alert("Error", "No se pudo marcar como ausente");
      }
    } catch (error) {
      console.error("Error marcando ausente (geocerca):", error);
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

      // 3. Calcular ruta optimizada (solo paradas con estudiantes activos)
      const paradasParaOptimizar = paradasVisibles;
      if (paradasParaOptimizar.length > 0) {

        try {
          const resultado = await calcularRutaOptimizada(
            ubicacionChofer,
            paradasParaOptimizar,
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

        // 5. Inicializar estados de geocercas para tracking de paradas
        inicializarEstadosGeocercas(recorridoActual.id, profile?.id || "")
          .then((ok) => {
            if (ok) {
              console.log("✅ Estados de geocercas inicializados");
            } else {
              console.warn("⚠️ No se pudieron inicializar geocercas");
            }
          })
          .catch((err) => {
            console.warn("Error inicializando geocercas:", err);
          });
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

  const formatHoraEC = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('es-EC', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'America/Guayaquil',
    });
  };

  const headerSubtitle = routeActive && horaInicioRecorrido
    ? `${recorridoActual?.nombre_ruta || "Recorrido"} · Salió ${formatHoraEC(horaInicioRecorrido)}`
    : recorridoActual?.nombre_ruta || "Sin recorrido";

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
        ) : routeActive && dentroDeZona && estudianteGeocerca ? (
          <>
            {/* Hero: student nearby via geocerca */}
            <NextStudentHero
              studentName={estudianteGeocerca.nombreCompleto}
              address={estudianteGeocerca.parada_nombre || "Sin direccion"}
              parentName={undefined}
              parentPhone={undefined}
              estimatedMinutes={etaProximaParada ?? undefined}
              isApproaching={true}
              onNavigate={handleNavigate}
              onMarkAbsent={handleMarcarAusenteGeocerca}
              isProcessing={
                processingStudent === estudianteGeocerca.id_estudiante
              }
            />

            {/* Quick stats */}
            <DriverQuickStats
              pickedUp={stats.completed}
              total={stats.total}
              remaining={stats.remaining}
              estimatedMinutes={etaFinRuta ?? undefined}
            />

            {/* Map card */}
            <MapCard
              paradas={paradasVisibles}
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
        ) : routeActive && (nextStudent || estudianteGeocerca) ? (
          <>
            {/* Route active but not near any stop - waiting state */}
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
              <View
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 32,
                  backgroundColor: Colors.tecnibus[50],
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 12,
                }}
              >
                <MapPinOff size={32} color={Colors.tecnibus[400]} strokeWidth={1.5} />
              </View>
              <Text
                className="font-bold"
                style={{ fontSize: 18, color: "#1F2937" }}
              >
                En camino a siguiente parada
              </Text>
              {horaInicioRecorrido && (
                <Text
                  style={{
                    fontSize: 12,
                    color: "#9CA3AF",
                    marginTop: 2,
                  }}
                >
                  Inicio: {formatHoraEC(horaInicioRecorrido)}
                </Text>
              )}
              {paradaMasCercana ? (
                <>
                  <Text
                    style={{
                      fontSize: 14,
                      color: "#6B7280",
                      textAlign: "center",
                      marginTop: 8,
                    }}
                  >
                    Proxima parada: {paradaMasCercana.parada.nombre || paradaMasCercana.parada.direccion || "Sin nombre"}
                  </Text>
                  <Text
                    className="font-semibold"
                    style={{
                      fontSize: 13,
                      color: Colors.tecnibus[600],
                      marginTop: 8,
                    }}
                  >
                    {paradaMasCercana.distanciaMetros > 1000
                      ? `${(paradaMasCercana.distanciaMetros / 1000).toFixed(1)} km`
                      : `${Math.round(paradaMasCercana.distanciaMetros)}m`}
                    {" de distancia"}
                    {etaProximaParada !== null ? ` · ~${etaProximaParada} min` : ""}
                  </Text>
                  {etaFinRuta !== null && (
                    <Text
                      style={{
                        fontSize: 11,
                        color: "#9CA3AF",
                        marginTop: 4,
                      }}
                    >
                      ETA fin de ruta: ~{etaFinRuta} min
                    </Text>
                  )}
                </>
              ) : (
                <Text
                  style={{
                    fontSize: 14,
                    color: "#6B7280",
                    textAlign: "center",
                    marginTop: 8,
                  }}
                >
                  Dirigete a la siguiente parada
                </Text>
              )}
            </View>

            {/* Quick stats */}
            <DriverQuickStats
              pickedUp={stats.completed}
              total={stats.total}
              remaining={stats.remaining}
              estimatedMinutes={etaFinRuta ?? undefined}
            />

            {/* Map card */}
            <MapCard
              paradas={paradasVisibles}
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
        ) : routeActive && !nextStudent && !estudianteGeocerca ? (
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
              <View
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 32,
                  backgroundColor: "#ECFDF5",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 12,
                }}
              >
                <CheckCircle2 size={36} color="#10B981" strokeWidth={2} />
              </View>
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
              paradas={paradasVisibles}
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
            {paradasVisibles.length > 0 && (
              <View style={{ marginTop: 16 }}>
                <MapCard
                  paradas={paradasVisibles}
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

      {/* Panel de estudiante actual (geocerca overlay - solo cuando dentro de zona) */}
      {routeActive && estudianteGeocerca && dentroDeZona && (
        <EstudianteActualPanel
          estudiante={estudianteGeocerca}
          dentroDeZona={dentroDeZona}
          distanciaMetros={distanciaMetros}
          onMarcarAusente={handleMarcarAusenteGeocerca}
          onCerrar={() => {}}
        />
      )}

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
        onMiddlePress={() => {}}
        onSettingsPress={() => router.push("/driver/settings")}
      />
    </View>
  );
}
