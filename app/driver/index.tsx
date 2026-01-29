import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Clock,
  LogOut,
  MapPin,
  Navigation,
  Play,
  Settings,
  Square,
  Users
} from 'lucide-react-native';
import { useState } from 'react';
import { ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { AnimatedButton, AnimatedCard, StatusBadge } from '../../components';
import { useAuth } from '../../lib/contexts/AuthContext';

type Student = {
  id: string;
  name: string;
  address: string;
  isAttending: boolean;
};

export default function DriverHomeScreen() {
  const router = useRouter();
  const { signOut, profile } = useAuth();
  const [routeActive, setRouteActive] = useState(false);

  const routeName = "Ruta Centro - Norte";
  const routeTime = "07:00 AM";
  const totalStudents = 12;

  const [students] = useState<Student[]>([
    { id: '1', name: 'María Rodríguez', address: 'Av. Principal #123', isAttending: true },
    { id: '2', name: 'Juan Pérez', address: 'Calle 5 #45', isAttending: true },
    { id: '3', name: 'Ana García', address: 'Urbanización Los Pinos', isAttending: false },
    { id: '4', name: 'Carlos Mendoza', address: 'Sector El Valle #78', isAttending: true },
    { id: '5', name: 'Sofía Torres', address: 'Calle Luna #90', isAttending: true },
    { id: '6', name: 'Luis Morales', address: 'Av. Libertad #234', isAttending: true },
    { id: '7', name: 'Elena Castillo', address: 'Barrio Centro #56', isAttending: false },
    { id: '8', name: 'Diego Ramírez', address: 'Calle Sol #12', isAttending: true },
  ]);

  const attendingCount = students.filter(s => s.isAttending).length;

  const renderStudentItem = (item: Student) => (
    <View key={item.id} className="bg-white rounded-xl p-4 mb-3 shadow-sm border border-gray-100">
      <View className="flex-row items-center justify-between">
        <View className="flex-1">
          <Text className="text-base font-bold text-gray-800 mb-1">
            {item.name}
          </Text>
          <View className="flex-row items-center">
            <MapPin size={14} color="#9ca3af" strokeWidth={2} />
            <Text className="text-sm text-gray-500 ml-1">
              {item.address}
            </Text>
          </View>
        </View>
        
        <StatusBadge 
          status={item.isAttending ? 'attending' : 'absent'}
          size="md"
        />
      </View>
    </View>
  );

  const handleSettings = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/driver/settings');
  };

  return (
    <View className="flex-1 bg-accent-50">
      <StatusBar barStyle="light-content" backgroundColor="#854d0e" />
      
      {/* Header */}
      <View className="bg-accent-600 pt-12 pb-6 px-6 rounded-b-3xl shadow-lg">
        <View className="flex-row items-center justify-between mb-4">
          <TouchableOpacity 
            onPress={() => router.back()}
            className="bg-accent-700 p-2 rounded-xl"
          >
            <ArrowLeft size={24} color="#ffffff" strokeWidth={2.5} />
          </TouchableOpacity>
          
          <TouchableOpacity
            className="bg-accent-700 p-2 rounded-xl"
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
              <Text className="text-accent-100 text-sm ml-1">
                Hora de salida: {routeTime}
              </Text>
            </View>
          </View>
        </View>

        {/* Contador de estudiantes */}
        <View className="bg-accent-700 rounded-xl p-3 mt-4 flex-row items-center justify-between">
          <View className="flex-row items-center">
            <Users size={20} color="#fef3c7" strokeWidth={2.5} />
            <Text className="text-white font-bold ml-2">
              Estudiantes: {attendingCount}/{totalStudents}
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
          iconBgColor="bg-accent-100"
          delay={0}
          className="mb-4"
        >
          <View className="bg-gray-100 rounded-xl h-64 items-center justify-center border-2 border-dashed border-gray-300">
            <MapPin size={56} color="#9ca3af" strokeWidth={2} />
            <Text className="text-gray-500 font-semibold mt-3 text-base">
              Vista de Mapa en Tiempo Real
            </Text>
            <Text className="text-gray-400 text-xs mt-1">
              Se implementará en fase funcional
            </Text>
            <View className="flex-row items-center mt-3">
              <View className="bg-green-500 w-3 h-3 rounded-full mr-2" />
              <Text className="text-gray-500 text-xs">
                Ubicación actual y ruta del recorrido
              </Text>
            </View>
          </View>
        </AnimatedCard>

        {/* Lista de Estudiantes */}
        <AnimatedCard delay={100} className="mb-4">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-bold text-gray-800">
              Lista de Estudiantes
            </Text>
            <View className="bg-accent-100 px-3 py-1 rounded-lg">
              <Text className="text-accent-700 font-bold text-sm">
                {attendingCount} asisten
              </Text>
            </View>
          </View>

          <View>
            {students.map(renderStudentItem)}
          </View>
        </AnimatedCard>

        {/* Botones de Control */}
        <View className="mb-4">
          {!routeActive ? (
            <AnimatedButton
              title="Iniciar Recorrido"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
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
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                setRouteActive(false);
              }}
              variant="danger"
              icon={Square}
              size="lg"
            />
          )}
        </View>

        {/* Nota informativa */}
        <View className="bg-accent-100 rounded-xl p-4 mb-6">
          <Text className="text-accent-800 text-sm text-center font-semibold">
            💡 Los estudiantes marcados como "Ausente" han sido notificados por sus padres
          </Text>
        </View>

        <View className="h-4" />
      </ScrollView>
    </View>
  );
}