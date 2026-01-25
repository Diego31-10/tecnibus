import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import {
  Bus,
  CheckCircle2,
  Clock,
  Info,
  LogOut,
  MapPin,
  User,
  XCircle
} from 'lucide-react-native';
import { useState } from 'react';
import { ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { AnimatedButton, AnimatedCard, StatusBadge } from '../../components';
import { useAuth } from '../../lib/contexts/AuthContext';

export default function ParentHomeScreen() {
  const router = useRouter();
  const { signOut } = useAuth();
  const [isAttending, setIsAttending] = useState(true);
  const studentName = "María Rodríguez";
  const route = "Ruta Centro - Norte";
  const estimatedTime = "15 minutos";
  const busStatus = "En camino";

  const handleToggleAttendance = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsAttending(!isAttending);
  };

  const handleViewDetails = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    console.log('Ver más detalles');
  };

  const handleLogout = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await signOut();
    router.replace('/login');
  };

  return (
    <View className="flex-1 bg-primary-50">
      <StatusBar barStyle="light-content" backgroundColor="#1e40af" />
      
      {/* Header */}
      <View className="bg-primary-700 pt-12 pb-6 px-6 rounded-b-3xl shadow-lg">
        <View className="flex-row items-center justify-between mb-4">
          <TouchableOpacity 
            onPress={() => router.back()}
            className="bg-primary-600 p-2 rounded-xl"
          >
            <User size={24} color="#ffffff" strokeWidth={2.5} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            className="bg-primary-600 p-2 rounded-xl"
            onPress={handleLogout}
          >
            <LogOut size={24} color="#ffffff" strokeWidth={2.5} />
          </TouchableOpacity>
        </View>

        <View className="flex-row items-center">
          <View className="bg-primary-600 p-3 rounded-full mr-4">
            <User size={28} color="#ffffff" strokeWidth={2.5} />
          </View>
          <View className="flex-1">
            <Text className="text-white text-2xl font-bold">
              {studentName}
            </Text>
            <Text className="text-primary-200 text-sm mt-1">
              {route}
            </Text>
          </View>
        </View>
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
              : 'Has marcado que el estudiante no asistirá hoy. El chofer ha sido notificado.'
            }
          </Text>

          <AnimatedButton
            title={isAttending ? 'Marcar como ausente' : 'Marcar como presente'}
            onPress={handleToggleAttendance}
            variant={isAttending ? 'danger' : 'success'}
            icon={isAttending ? XCircle : CheckCircle2}
            size="md"
          />
        </AnimatedCard>

        {/* Card de Ubicación - Animado con delay 100ms */}
        <AnimatedCard 
          title="Ubicación de la Buseta" 
          icon={Bus}
          iconColor="#2563eb"
          iconBgColor="bg-primary-100"
          delay={100}
          className="mb-4"
        >
          <View className="bg-gray-100 rounded-xl h-48 mb-4 items-center justify-center border-2 border-dashed border-gray-300">
            <MapPin size={48} color="#9ca3af" strokeWidth={2} />
            <Text className="text-gray-500 font-semibold mt-2">
              Mapa en tiempo real
            </Text>
            <Text className="text-gray-400 text-xs mt-1">
              Se implementará en fase funcional
            </Text>
          </View>

          <View className="bg-primary-50 rounded-xl p-4 flex-row items-center">
            <View className="bg-primary-600 p-2 rounded-full">
              <Bus size={24} color="#ffffff" strokeWidth={2.5} />
            </View>
            <View className="flex-1 ml-3">
              <Text className="text-primary-800 font-bold text-base">
                {busStatus}
              </Text>
              <Text className="text-primary-600 text-sm">
                La buseta está en ruta hacia tu ubicación
              </Text>
            </View>
          </View>
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
          <View className="bg-gradient-to-r from-accent-50 to-accent-100 rounded-xl p-6 items-center">
            <Text className="text-accent-800 text-5xl font-bold">
              {estimatedTime}
            </Text>
            <Text className="text-accent-700 text-sm mt-2 font-semibold">
              Tiempo aproximado
            </Text>
          </View>

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
    </View>
  );
}