import { Colors } from '@/lib/constants/colors';
import { haptic } from '@/lib/utils/haptics';
import { createShadow } from '@/lib/utils/shadows';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Bus,
  Hash,
  Users
} from 'lucide-react-native';
import { useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedCard } from '../../../components';
import Toast from '../../../components/Toast';
import {
  createBuseta
} from '../../../lib/services/busetas.service';

export default function CrearBusetaScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const paddingTop = Math.max(insets.top + 8, 48);
  const shadow = createShadow('lg');

  // Form state
  const [placa, setPlaca] = useState('');
  const [capacidad, setCapacidad] = useState('');

  // UI State
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
  }>({
    visible: false,
    message: '',
    type: 'success',
  });

  const handleSubmit = async () => {
    // Validaciones
    if (!placa.trim()) {
      setToast({ visible: true, message: 'Ingresa la placa', type: 'warning' });
      return;
    }

    const capacidadNum = parseInt(capacidad);
    if (!capacidad.trim() || isNaN(capacidadNum) || capacidadNum <= 0) {
      setToast({
        visible: true,
        message: 'Ingresa una capacidad válida',
        type: 'warning',
      });
      return;
    }

    haptic.medium();
    setLoading(true);

    const result = await createBuseta({
      placa: placa.trim(),
      capacidad: capacidadNum,
    });

    setLoading(false);

    if (result) {
      setToast({
        visible: true,
        message: 'Buseta creada correctamente',
        type: 'success',
      });
      setTimeout(() => router.back(), 1500);
    } else {
      setToast({
        visible: true,
        message: 'Error al crear la buseta',
        type: 'error',
      });
    }
  };

  return (
    <View className="flex-1 bg-admin-50">
      <StatusBar barStyle="light-content" backgroundColor={Colors.buseta[700]} translucent={false} />

      {/* Header */}
      <View className="bg-buseta-700 pb-6 px-6 rounded-b-3xl" style={[{ paddingTop }, shadow]}>
        <View className="flex-row items-center justify-between mb-4">
          <TouchableOpacity
            onPress={() => router.back()}
            className="bg-buseta-600 p-2 rounded-lg"
          >
            <ArrowLeft size={24} color="#ffffff" strokeWidth={2.5} />
          </TouchableOpacity>
        </View>

        <View className="flex-row items-center">
          <View className="bg-buseta-600 p-3 rounded-full mr-4">
            <Bus size={28} color="#ffffff" strokeWidth={2.5} />
          </View>
          <View className="flex-1">
            <Text className="text-white text-2xl font-bold">Nueva Buseta</Text>
            <Text className="text-white text-base mt-1">
              Completa la información de la buseta
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Placa */}
        <AnimatedCard delay={0} className="mb-4">
          <Text className="text-sm font-semibold text-gray-700 mb-2">
            Placa *
          </Text>
          <View className="flex-row items-center bg-gray-50 rounded-lg px-4 py-3">
            <Hash size={20} color="#6b7280" strokeWidth={2} />
            <TextInput
              className="flex-1 ml-3 text-base text-gray-800"
              placeholder="Ej: ABC123"
              placeholderTextColor="#9ca3af"
              value={placa}
              onChangeText={(text) => setPlaca(text.toUpperCase())}
              autoCapitalize="characters"
              maxLength={10}
            />
          </View>
        </AnimatedCard>

        {/* Capacidad */}
        <AnimatedCard delay={100} className="mb-4">
          <Text className="text-sm font-semibold text-gray-700 mb-2">
            Capacidad (pasajeros) *
          </Text>
          <View className="flex-row items-center bg-gray-50 rounded-lg px-4 py-3">
            <Users size={20} color="#6b7280" strokeWidth={2} />
            <TextInput
              className="flex-1 ml-3 text-base text-gray-800"
              placeholder="Ej: 30"
              placeholderTextColor="#9ca3af"
              value={capacidad}
              onChangeText={setCapacidad}
              keyboardType="numeric"
              maxLength={3}
            />
          </View>
        </AnimatedCard>

        {/* Botón Crear */}
        <AnimatedCard delay={200}>
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={loading}
            className={`rounded-xl py-4 flex-row items-center justify-center ${
              loading ? 'bg-buseta-400' : 'bg-buseta-600'
            }`}
            style={shadow}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <>
                <Bus size={20} color="#ffffff" strokeWidth={2.5} />
                <Text className="text-white font-bold text-lg ml-2">
                  Crear Buseta
                </Text>
              </>
            )}
          </TouchableOpacity>
        </AnimatedCard>
      </ScrollView>

      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast({ ...toast, visible: false })}
      />
    </View>
  );
}
