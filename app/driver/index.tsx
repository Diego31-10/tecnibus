import { View, Text, StatusBar, ScrollView } from 'react-native';
import { useState } from 'react';
import {
  MapPin,
  Bus,
  Play,
  Square,
  Users,
  Navigation,
} from 'lucide-react-native';
import {
  Header,
  StatusBadge,
  Toast,
  AnimatedCard,
  AnimatedButton,
} from '../../components';
import * as Haptics from 'expo-haptics';

type Student = {
  id: string;
  name: string;
  address: string;
  isAttending: boolean;
};

export default function DriverHomeScreen() {
  const [routeActive, setRouteActive] = useState(false);

  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] =
    useState<'success' | 'warning' | 'info'>('success');

  const routeName = 'Ruta Centro - Norte';
  const routeTime = '07:00 AM';
  const totalStudents = 12;

  const students: Student[] = [
    { id: '1', name: 'María Rodríguez', address: 'Av. Principal #123', isAttending: true },
    { id: '2', name: 'Juan Pérez', address: 'Calle 5 #45', isAttending: true },
    { id: '3', name: 'Ana García', address: 'Urbanización Los Pinos', isAttending: false },
    { id: '4', name: 'Carlos Mendoza', address: 'Sector El Valle #78', isAttending: true },
  ];

  const attendingCount = students.filter(s => s.isAttending).length;

  const handleStartRoute = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setRouteActive(true);
    setToastMessage('🚍 Recorrido iniciado correctamente');
    setToastType('success');
    setToastVisible(true);
  };

  const handleEndRoute = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setRouteActive(false);
    setToastMessage('⏹️ Recorrido finalizado');
    setToastType('warning');
    setToastVisible(true);
  };

  return (
    <View className="flex-1 bg-accent-50">
      <StatusBar barStyle="light-content" backgroundColor="#854d0e" />

      {/* Toast global */}
      <Toast
        visible={toastVisible}
        message={toastMessage}
        type={toastType}
        onHide={() => setToastVisible(false)}
      />

      <Header
        title={routeName}
        subtitle={`Hora de salida: ${routeTime}`}
        icon={Bus}
        variant="driver"
        rightIcon={Bus}
      />

      {/* Contador animado */}
      <AnimatedCard delay={0} className="mx-6 mt-4 mb-4">
        <View className="bg-accent-600 rounded-xl p-3 flex-row justify-between items-center">
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
      </AnimatedCard>

      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        {/* Card del mapa */}
        <AnimatedCard
          title="Mapa de Recorrido"
          icon={Navigation}
          iconColor="#ca8a04"
          iconBgColor="bg-accent-100"
          delay={100}
          className="mb-4"
        >
          <View className="bg-gray-100 rounded-xl h-64 items-center justify-center border-2 border-dashed border-gray-300">
            <MapPin size={56} color="#9ca3af" strokeWidth={2} />
            <Text className="text-gray-500 font-semibold mt-3">
              Mapa en tiempo real
            </Text>
            <Text className="text-gray-400 text-xs mt-1">
              Se implementará en fase funcional
            </Text>
          </View>
        </AnimatedCard>

        {/* Lista de estudiantes */}
        <AnimatedCard
          title="Lista de Estudiantes"
          delay={200}
          className="mb-4"
        >
          {students.map(student => (
            <View
              key={student.id}
              className="bg-white rounded-xl p-4 mb-3 border border-gray-100"
            >
              <Text className="font-bold text-gray-800">
                {student.name}
              </Text>
              <Text className="text-sm text-gray-500">
                {student.address}
              </Text>
              <View className="mt-2">
                <StatusBadge
                  status={student.isAttending ? 'attending' : 'absent'}
                  size="sm"
                />
              </View>
            </View>
          ))}
        </AnimatedCard>

        {/* Botón animado */}
        <View className="mb-6">
          {!routeActive ? (
            <AnimatedButton
              title="Iniciar Recorrido"
              onPress={handleStartRoute}
              variant="success"
              icon={Play}
              size="lg"
            />
          ) : (
            <AnimatedButton
              title="Finalizar Recorrido"
              onPress={handleEndRoute}
              variant="danger"
              icon={Square}
              size="lg"
            />
          )}
        </View>

        <View className="h-4" />
      </ScrollView>
    </View>
  );
}
