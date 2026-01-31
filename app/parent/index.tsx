import { Colors } from '@/lib/constants/colors';
import { haptic } from '@/lib/utils/haptics';
import { createShadow } from '@/lib/utils/shadows';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  Bus,
  CheckCircle2,
  ChevronDown,
  Clock,
  GraduationCap,
  Info,
  MapPin,
  Settings,
  User,
  XCircle
} from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedButton, AnimatedCard, StatusBadge } from '../../components';
import { useAuth } from '../../contexts/AuthContext';
import {
  EstudianteDelPadre,
  getMyEstudiantes
} from '../../lib/services/padres.service';
import {
  toggleAsistencia,
  getEstadoAsistencia
} from '@/lib/services/asistencias.service';
import { supabase } from '@/lib/services/supabase';

export default function ParentHomeScreen() {
  const router = useRouter();
  const { signOut } = useAuth();
  const insets = useSafeAreaInsets();

  // Estados
  const [loading, setLoading] = useState(true);
  const [estudiantes, setEstudiantes] = useState<EstudianteDelPadre[]>([]);
  const [estudianteSeleccionado, setEstudianteSeleccionado] =
    useState<EstudianteDelPadre | null>(null);
  const [showSelector, setShowSelector] = useState(false);
  const [isAttending, setIsAttending] = useState(true);
  const [processingAttendance, setProcessingAttendance] = useState(false);
  const [marcadoPorChofer, setMarcadoPorChofer] = useState(false);

  const paddingTop = Math.max(insets.top + 8, 48);
  const shadow = createShadow('lg');

  // Datos temporales (hasta implementar funcionalidad completa)
  const estimatedTime = '15 minutos';
  const busStatus = 'En camino';

  useEffect(() => {
    loadEstudiantes();
  }, []);

  // Cargar estado de asistencia cuando cambia el estudiante seleccionado
  useEffect(() => {
    if (estudianteSeleccionado?.id) {
      cargarEstadoAsistencia();
    }
  }, [estudianteSeleccionado?.id]);

  // Suscripción en tiempo real a cambios en asistencias
  useEffect(() => {
    if (!estudianteSeleccionado?.id) return;

    console.log('🔔 Padre: Suscribiendo a cambios en asistencias...');

    const channel = supabase
      .channel('asistencias-padre-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'asistencias',
          filter: `id_estudiante=eq.${estudianteSeleccionado.id}`,
        },
        (payload) => {
          console.log('🔔 Padre: Cambio detectado en asistencia:', payload);
          // Actualizar estado automáticamente
          cargarEstadoAsistencia();
        }
      )
      .subscribe();

    return () => {
      console.log('🔕 Padre: Desuscribiendo de cambios');
      supabase.removeChannel(channel);
    };
  }, [estudianteSeleccionado?.id]);

  const cargarEstadoAsistencia = async () => {
    if (!estudianteSeleccionado?.id) return;

    try {
      const hoy = new Date().toISOString().split('T')[0];
      const { data } = await supabase
        .from('asistencias')
        .select('estado, notas')
        .eq('id_estudiante', estudianteSeleccionado.id)
        .eq('fecha', hoy)
        .single();

      const estaPresente = data?.estado === 'presente' || !data;
      const marcadoPorChof = data?.notas?.includes('chofer') || false;

      setIsAttending(estaPresente);
      setMarcadoPorChofer(!estaPresente && marcadoPorChof);
    } catch (error) {
      // Si no hay registro, está presente por defecto
      setIsAttending(true);
      setMarcadoPorChofer(false);
    }
  };

  const loadEstudiantes = async () => {
    setLoading(true);
    const data = await getMyEstudiantes();
    setEstudiantes(data);

    // Seleccionar el primero por defecto
    if (data.length > 0) {
      setEstudianteSeleccionado(data[0]);
    }

    setLoading(false);
  };

  const handleSelectEstudiante = (estudiante: EstudianteDelPadre) => {
    haptic.light();
    setEstudianteSeleccionado(estudiante);
    setShowSelector(false);
  };

  const handleToggleAttendance = async () => {
    if (!estudianteSeleccionado?.id || !estudianteSeleccionado?.parada?.ruta?.id) {
      Alert.alert('Error', 'No se puede marcar asistencia sin estudiante o ruta asignada');
      return;
    }

    try {
      setProcessingAttendance(true);
      haptic.medium();

      // Si está presente (true), marcar ausente (true)
      // Si está ausente (false), marcar presente (false)
      const marcarComoAusente = isAttending;

      const success = await toggleAsistencia(
        estudianteSeleccionado.id,
        estudianteSeleccionado.parada.ruta.id,
        marcarComoAusente
      );

      if (success) {
        // Invertir el estado actual
        setIsAttending(!isAttending);
        haptic.success();

        if (marcarComoAusente) {
          Alert.alert(
            'Ausencia registrada',
            'El chofer ha sido notificado que el estudiante no asistirá hoy.'
          );
        } else {
          Alert.alert(
            'Asistencia actualizada',
            'El estudiante volverá a ser recogido normalmente.'
          );
        }
      } else {
        haptic.error();
        Alert.alert('Error', 'No se pudo actualizar la asistencia. Intenta nuevamente.');
      }
    } catch (error) {
      console.error('Error toggling attendance:', error);
      haptic.error();
      Alert.alert('Error', 'Ocurrió un error al actualizar la asistencia');
    } finally {
      setProcessingAttendance(false);
    }
  };

  const handleViewDetails = () => {
    haptic.light();
    console.log('Ver más detalles');
  };

  const handleSettings = () => {
    haptic.light();
    router.push('/parent/settings');
  };

  // Mostrar loading
  if (loading) {
    return (
      <View className="flex-1 bg-padre-50 items-center justify-center">
        <ActivityIndicator size="large" color="#2563eb" />
        <Text className="text-gray-500 mt-4">Cargando información...</Text>
      </View>
    );
  }

  // Si no tiene estudiantes asignados
  if (estudiantes.length === 0) {
    return (
      <View className="flex-1 bg-padre-50 items-center justify-center px-6">
        <View className="bg-gray-100 p-4 rounded-full mb-4">
          <GraduationCap size={48} color="#9ca3af" strokeWidth={2} />
        </View>
        <Text className="text-gray-800 text-xl font-bold mb-2">
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
    <View className="flex-1 bg-padre-50">
      <StatusBar barStyle="light-content" backgroundColor="#1e40af" />
      
      {/* Header */}
      <View className="bg-padre-700 pb-6 px-6 rounded-b-3xl" style={[{ paddingTop }, shadow]}>
        <View className="flex-row items-center justify-between mb-4">
          <TouchableOpacity
            onPress={() => router.back()}
            className="bg-padre-600 p-2 rounded-xl"
          >
            <User size={24} color="#ffffff" strokeWidth={2.5} />
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-padre-600 p-2 rounded-xl"
            onPress={handleSettings}
          >
            <Settings size={24} color="#ffffff" strokeWidth={2.5} />
          </TouchableOpacity>
        </View>

        {/* Selector de estudiante (si tiene múltiples hijos) */}
        {estudiantes.length > 1 ? (
          <TouchableOpacity
            onPress={() => setShowSelector(true)}
            className="flex-row items-center bg-padre-600 rounded-xl p-3 mb-3"
            activeOpacity={0.7}
          >
            <View className="bg-padre-500 p-2 rounded-full mr-3">
              <GraduationCap size={24} color="#ffffff" strokeWidth={2.5} />
            </View>
            <View className="flex-1">
              <Text className="text-white text-lg font-bold">
                {estudianteSeleccionado?.nombreCompleto}
              </Text>
              <Text className="text-padre-200 text-xs">
                {estudianteSeleccionado?.parada?.ruta?.nombre || 'Sin ruta asignada'}
              </Text>
            </View>
            <ChevronDown size={20} color="#ffffff" strokeWidth={2.5} />
          </TouchableOpacity>
        ) : (
          <View className="flex-row items-center">
            <View className="bg-padre-600 p-3 rounded-full mr-4">
              <GraduationCap size={28} color="#ffffff" strokeWidth={2.5} />
            </View>
            <View className="flex-1">
              <Text className="text-white text-2xl font-bold">
                {estudianteSeleccionado?.nombreCompleto}
              </Text>
              <Text className="text-padre-200 text-sm mt-1">
                {estudianteSeleccionado?.parada?.ruta?.nombre || 'Sin ruta asignada'}
              </Text>
            </View>
          </View>
        )}
      </View>

      <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>
        {/* Card de Estado - Animado con delay 0 */}
        <AnimatedCard title="Estado de Asistencia" delay={0} className="mb-4">
          <View className="flex-row items-center justify-end mb-4">
            <StatusBadge 
              status={isAttending ? 'attending' : 'absent'} 
              size="md"
            />
          </View>

          <Text className="text-gray-600 text-sm mb-4">
            {isAttending
              ? 'El estudiante asistirá hoy y será recogido en el punto habitual.'
              : marcadoPorChofer
                ? '⚠️ El chofer reportó que el estudiante no se presentó. Si fue un error, puede marcarlo como presente nuevamente.'
                : 'Has marcado que el estudiante no asistirá hoy. El chofer ha sido notificado.'
            }
          </Text>

          <AnimatedButton
            title={
              processingAttendance
                ? 'Actualizando...'
                : (isAttending ? 'Marcar como ausente' : 'Marcar como presente')
            }
            onPress={handleToggleAttendance}
            variant={isAttending ? 'danger' : 'success'}
            icon={isAttending ? XCircle : CheckCircle2}
            size="md"
            disabled={processingAttendance || !estudianteSeleccionado?.parada?.ruta}
          />
        </AnimatedCard>

        {/* Card de Ubicación - Animado con delay 100ms */}
        <AnimatedCard
          title="Ubicación de la Buseta"
          icon={Bus}
          iconColor={Colors.padre[600]}
          iconBgColor="bg-padre-100"
          delay={100}
          className="mb-4"
        >
          {estudianteSeleccionado?.parada?.ruta ? (
            <>
              <View className="bg-gray-100 rounded-xl h-48 mb-4 items-center justify-center border-2 border-dashed border-gray-300">
                <MapPin size={48} color="#9ca3af" strokeWidth={2} />
                <Text className="text-gray-500 font-semibold mt-2">
                  Mapa en tiempo real
                </Text>
                <Text className="text-gray-400 text-xs mt-1">
                  Se implementará en fase funcional
                </Text>
              </View>

              <View className="bg-padre-50 rounded-xl p-4 flex-row items-center">
                <View className="bg-padre-600 p-2 rounded-full">
                  <Bus size={24} color={Colors.padre[600]} strokeWidth={2.5} />
                </View>
                <View className="flex-1 ml-3">
                  <Text className="text-padre-800 font-bold text-base">
                    {busStatus}
                  </Text>
                  <Text className="text-padre-600 text-sm">
                    Ruta: {estudianteSeleccionado.parada?.ruta?.nombre || 'Sin ruta'}
                  </Text>
                </View>
              </View>
            </>
          ) : (
            <View className="bg-amber-50 rounded-xl p-4 flex-row items-start border-2 border-amber-200">
              <Info size={20} color="#f59e0b" strokeWidth={2} />
              <View className="flex-1 ml-3">
                <Text className="text-amber-800 font-semibold text-sm">
                  Sin ruta asignada
                </Text>
                <Text className="text-amber-700 text-xs mt-1">
                  Este estudiante aún no tiene una ruta asignada. Contacta al
                  administrador para asignar una ruta.
                </Text>
              </View>
            </View>
          )}
        </AnimatedCard>

        {/* Card de ETA - Animado con delay 200ms */}
        <AnimatedCard 
          title="Tiempo Estimado de Llegada"
          icon={Clock}
          iconColor="#ca8a04"
          iconBgColor="bg-accent-100"
          delay={200}
          className="mb-4"
        >
          <LinearGradient
            colors={['#fefce8', '#fef9c3']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            className="rounded-xl p-6 items-center"
          >
            <Text className="text-accent-800 text-5xl font-bold">
              {estimatedTime}
            </Text>
            <Text className="text-accent-700 text-sm mt-2 font-semibold">
              Tiempo aproximado
            </Text>
          </LinearGradient>

          <View className="mt-4 bg-gray-50 rounded-xl p-3 flex-row items-start">
            <Info size={18} color="#6b7280" strokeWidth={2} />
            <Text className="text-gray-600 text-xs ml-2 flex-1">
              El tiempo es estimado y puede variar según el tráfico y las condiciones del recorrido.
            </Text>
          </View>
        </AnimatedCard>

        {/* Botón animado con delay 300ms */}
        <View style={{ transform: [{ translateY: 0 }] }}>
          <AnimatedButton
            title="Ver Más Detalles del Recorrido"
            onPress={handleViewDetails}
            variant="primary"
            size="lg"
          />
        </View>

        <View className="h-6" />
      </ScrollView>

      {/* Modal Selector de Estudiante */}
      <Modal
        visible={showSelector}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSelector(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl" style={{ maxHeight: '60%' }}>
            <View className="p-6 border-b border-gray-200">
              <Text className="text-xl font-bold text-gray-800">
                Seleccionar Estudiante
              </Text>
              <Text className="text-gray-500 text-sm mt-1">
                Tienes {estudiantes.length} estudiante(s) asignado(s)
              </Text>
            </View>

            <FlatList
              data={estudiantes}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => handleSelectEstudiante(item)}
                  className="px-6 py-4 border-b border-gray-100"
                  activeOpacity={0.7}
                >
                  <View className="flex-row items-center">
                    <View className="bg-padre-100 p-3 rounded-full mr-3">
                      <GraduationCap size={24} color="#2563eb" strokeWidth={2} />
                    </View>
                    <View className="flex-1">
                      <Text className="text-gray-800 font-semibold text-base">
                        {item.nombreCompleto}
                      </Text>
                      <Text className="text-gray-500 text-sm mt-1">
                        {item.parada?.ruta?.nombre || 'Sin ruta asignada'}
                      </Text>
                    </View>
                    {estudianteSeleccionado?.id === item.id && (
                      <View className="bg-padre-600 p-1 rounded-full">
                        <CheckCircle2 size={20} color="#ffffff" strokeWidth={2.5} />
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              )}
            />

            <View className="p-4 border-t border-gray-200">
              <TouchableOpacity
                onPress={() => setShowSelector(false)}
                className="bg-gray-100 py-3 rounded-xl"
                activeOpacity={0.7}
              >
                <Text className="text-gray-700 font-semibold text-center">
                  Cancelar
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}