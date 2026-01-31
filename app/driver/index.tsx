import { haptic } from '@/lib/utils/haptics';
import { createShadow } from '@/lib/utils/shadows';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  ArrowDown,
  ArrowUp,
  Clock,
  MapPin,
  Navigation,
  Play,
  Settings,
  Square,
  Users,
  CheckCircle2,
  XCircle
} from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedButton, AnimatedCard, StatusBadge } from '../../components';
import { useAuth } from '../../contexts/AuthContext';
import {
  getEstudiantesConAsistencia,
  registrarAsistencia,
  type EstudianteConAsistencia
} from '@/lib/services/asistencias.service';

export default function DriverHomeScreen() {
  const router = useRouter();
  const { signOut, profile } = useAuth();
  const insets = useSafeAreaInsets();
  const [routeActive, setRouteActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [estudiantes, setEstudiantes] = useState<EstudianteConAsistencia[]>([]);
  const [processingStudent, setProcessingStudent] = useState<string | null>(null);

  const paddingTop = Math.max(insets.top + 8, 48);
  const shadow = createShadow('lg');

  // TODO: Obtener de la DB cuando tengamos choferes con rutas asignadas
  const routeName = "Ruta Centro - Norte";
  const routeTime = "07:00 AM";
  const idRutaDemo = "ruta-demo-123"; // Temporal

  // Cargar estudiantes
  const cargarEstudiantes = useCallback(async () => {
    if (!profile?.id) return;

    try {
      setLoading(true);
      const data = await getEstudiantesConAsistencia(idRutaDemo, profile.id);
      setEstudiantes(data);
    } catch (error) {
      console.error('Error cargando estudiantes:', error);
      Alert.alert('Error', 'No se pudieron cargar los estudiantes');
    } finally {
      setLoading(false);
    }
  }, [profile?.id]);

  useEffect(() => {
    cargarEstudiantes();
  }, [cargarEstudiantes]);

  const handleCheckIn = async (idEstudiante: string, tipo: 'subida' | 'bajada') => {
    if (!profile?.id) return;

    try {
      setProcessingStudent(idEstudiante);
      haptic.medium();

      const result = await registrarAsistencia({
        id_estudiante: idEstudiante,
        id_chofer: profile.id,
        tipo,
      });

      if (result) {
        // Recargar lista
        await cargarEstudiantes();
        haptic.success();
      } else {
        haptic.error();
        Alert.alert('Error', 'No se pudo registrar la asistencia');
      }
    } catch (error) {
      console.error('Error en check-in:', error);
      haptic.error();
      Alert.alert('Error', 'Ocurrió un error al registrar');
    } finally {
      setProcessingStudent(null);
    }
  };

  const attendingCount = estudiantes.filter(e => e.enBuseta).length;
  const totalStudents = estudiantes.length;

  const renderStudentItem = (item: EstudianteConAsistencia) => {
    const isProcessing = processingStudent === item.id;
    const isInBus = item.enBuseta;

    return (
      <View key={item.id} className="bg-white rounded-xl p-4 mb-3 shadow-sm border border-gray-100">
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-1">
            <Text className="text-base font-bold text-gray-800 mb-1">
              {item.nombre} {item.apellido}
            </Text>
            {item.ultimaAsistencia && (
              <View className="flex-row items-center">
                <Clock size={12} color="#9ca3af" strokeWidth={2} />
                <Text className="text-xs text-gray-500 ml-1">
                  {isInBus ? 'Subió' : 'Bajó'} {new Date(item.ultimaAsistencia.fecha_hora).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            )}
          </View>

          <StatusBadge
            status={isInBus ? 'attending' : 'absent'}
            size="md"
          />
        </View>

        {/* Botones de check-in */}
        <View className="flex-row gap-2">
          <TouchableOpacity
            className={`flex-1 flex-row items-center justify-center py-2.5 px-3 rounded-lg ${
              isInBus ? 'bg-gray-100' : 'bg-green-500'
            }`}
            onPress={() => handleCheckIn(item.id, 'subida')}
            disabled={isProcessing || isInBus}
          >
            {isProcessing && !isInBus ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <>
                <ArrowUp
                  size={16}
                  color={isInBus ? '#9ca3af' : '#ffffff'}
                  strokeWidth={2.5}
                />
                <Text className={`ml-1.5 font-semibold text-sm ${
                  isInBus ? 'text-gray-400' : 'text-white'
                }`}>
                  Subió
                </Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            className={`flex-1 flex-row items-center justify-center py-2.5 px-3 rounded-lg ${
              !isInBus ? 'bg-gray-100' : 'bg-red-500'
            }`}
            onPress={() => handleCheckIn(item.id, 'bajada')}
            disabled={isProcessing || !isInBus}
          >
            {isProcessing && isInBus ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <>
                <ArrowDown
                  size={16}
                  color={!isInBus ? '#9ca3af' : '#ffffff'}
                  strokeWidth={2.5}
                />
                <Text className={`ml-1.5 font-semibold text-sm ${
                  !isInBus ? 'text-gray-400' : 'text-white'
                }`}>
                  Bajó
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const handleSettings = () => {
    haptic.light();
    router.push('/driver/settings');
  };

  return (
    <View className="flex-1 bg-chofer-50">
      <StatusBar barStyle="light-content" backgroundColor="#854d0e" />

      {/* Header */}
      <View className="bg-chofer-600 pb-6 px-6 rounded-b-3xl" style={[{ paddingTop }, shadow]}>
        <View className="flex-row items-center justify-between mb-4">
          <TouchableOpacity
            onPress={() => router.back()}
            className="bg-chofer-700 p-2 rounded-xl"
          >
            <ArrowLeft size={24} color="#ffffff" strokeWidth={2.5} />
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-chofer-700 p-2 rounded-xl"
            onPress={handleSettings}
          >
            <Settings size={24} color="#ffffff" strokeWidth={2.5} />
          </TouchableOpacity>
        </View>

        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="text-white text-2xl font-bold">
              {routeName}
            </Text>
            <View className="flex-row items-center mt-2">
              <Clock size={16} color="#fef3c7" strokeWidth={2} />
              <Text className="text-chofer-100 text-sm ml-1">
                Hora de salida: {routeTime}
              </Text>
            </View>
          </View>
        </View>

        {/* Contador de estudiantes */}
        <View className="bg-chofer-700 rounded-xl p-3 mt-4 flex-row items-center justify-between">
          <View className="flex-row items-center">
            <Users size={20} color="#fef3c7" strokeWidth={2.5} />
            <Text className="text-white font-bold ml-2">
              En buseta: {attendingCount}/{totalStudents}
            </Text>
          </View>
          {routeActive && (
            <StatusBadge status="active" size="sm" showIcon={false} />
          )}
        </View>
      </View>

      <ScrollView className="flex-1 px-6 pt-4" showsVerticalScrollIndicator={false}>
        {/* Card del Mapa */}
        <AnimatedCard
          title="Mapa de Recorrido"
          icon={Navigation}
          iconColor="#ca8a04"
          iconBgColor="bg-chofer-100"
          delay={0}
          className="mb-4"
        >
          <View className="bg-gray-100 rounded-xl h-48 items-center justify-center border-2 border-dashed border-gray-300">
            <MapPin size={48} color="#9ca3af" strokeWidth={2} />
            <Text className="text-gray-500 font-semibold mt-3 text-sm">
              Vista de Mapa en Tiempo Real
            </Text>
            <Text className="text-gray-400 text-xs mt-1">
              Próxima funcionalidad
            </Text>
          </View>
        </AnimatedCard>

        {/* Lista de Estudiantes */}
        <AnimatedCard delay={100} className="mb-4">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-bold text-gray-800">
              Control de Asistencia
            </Text>
            <TouchableOpacity
              onPress={cargarEstudiantes}
              disabled={loading}
              className="bg-chofer-100 px-3 py-1.5 rounded-lg"
            >
              {loading ? (
                <ActivityIndicator size="small" color="#ca8a04" />
              ) : (
                <Text className="text-chofer-700 font-bold text-sm">
                  Actualizar
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {loading && estudiantes.length === 0 ? (
            <View className="py-8 items-center">
              <ActivityIndicator size="large" color="#ca8a04" />
              <Text className="text-gray-500 mt-3">Cargando estudiantes...</Text>
            </View>
          ) : estudiantes.length === 0 ? (
            <View className="py-8 items-center">
              <Users size={48} color="#9ca3af" strokeWidth={1.5} />
              <Text className="text-gray-500 mt-3 font-semibold">
                No hay estudiantes asignados
              </Text>
              <Text className="text-gray-400 text-xs mt-1">
                Contacta al administrador
              </Text>
            </View>
          ) : (
            <View>
              {estudiantes.map(renderStudentItem)}
            </View>
          )}
        </AnimatedCard>

        {/* Botones de Control */}
        <View className="mb-4">
          {!routeActive ? (
            <AnimatedButton
              title="Iniciar Recorrido"
              onPress={() => {
                haptic.heavy();
                setRouteActive(true);
              }}
              variant="success"
              icon={Play}
              size="lg"
            />
          ) : (
            <AnimatedButton
              title="Finalizar Recorrido"
              onPress={() => {
                haptic.heavy();
                setRouteActive(false);
              }}
              variant="danger"
              icon={Square}
              size="lg"
            />
          )}
        </View>

        {/* Leyenda informativa */}
        <View className="bg-chofer-100 rounded-xl p-4 mb-6">
          <View className="flex-row items-center mb-2">
            <CheckCircle2 size={16} color="#16a34a" strokeWidth={2} />
            <Text className="text-chofer-800 text-xs ml-2 font-semibold">
              Verde = Estudiante en la buseta
            </Text>
          </View>
          <View className="flex-row items-center">
            <XCircle size={16} color="#ef4444" strokeWidth={2} />
            <Text className="text-chofer-800 text-xs ml-2 font-semibold">
              Rojo = Estudiante fuera de la buseta
            </Text>
          </View>
        </View>

        <View className="h-4" />
      </ScrollView>
    </View>
  );
}
