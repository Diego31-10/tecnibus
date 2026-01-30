import { haptic } from '@/lib/utils/haptics';
import { createShadow } from '@/lib/utils/shadows';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  MapPin,
  Type,
  XCircle
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
  createRuta
} from '../../../lib/services/rutas.service';

export default function CrearRutaScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const paddingTop = Math.max(insets.top + 8, 48);
  const shadow = createShadow('lg');

  // Form state
  const [nombre, setNombre] = useState('');
  const [horaInicio, setHoraInicio] = useState('');
  const [horaFin, setHoraFin] = useState('');
  const [estado, setEstado] = useState<'activa' | 'inactiva'>('activa');

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

  const validateTime = (time: string): boolean => {
    const regex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return regex.test(time);
  };

  const handleSubmit = async () => {
    // Validaciones
    if (!nombre.trim()) {
      setToast({ visible: true, message: 'Ingresa el nombre de la ruta', type: 'warning' });
      return;
    }

    if (horaInicio && !validateTime(horaInicio)) {
      setToast({
        visible: true,
        message: 'Formato de hora de inicio inválido (HH:MM)',
        type: 'warning',
      });
      return;
    }

    if (horaFin && !validateTime(horaFin)) {
      setToast({
        visible: true,
        message: 'Formato de hora de fin inválido (HH:MM)',
        type: 'warning',
      });
      return;
    }

    // Validar que hora fin sea mayor que hora inicio
    if (horaInicio && horaFin) {
      const [inicioH, inicioM] = horaInicio.split(':').map(Number);
      const [finH, finM] = horaFin.split(':').map(Number);
      const inicioMinutos = inicioH * 60 + inicioM;
      const finMinutos = finH * 60 + finM;

      if (finMinutos <= inicioMinutos) {
        setToast({
          visible: true,
          message: 'La hora de fin debe ser mayor que la hora de inicio',
          type: 'warning',
        });
        return;
      }
    }

    haptic.medium();
    setLoading(true);

    const result = await createRuta({
      nombre: nombre.trim(),
      hora_inicio: horaInicio || null,
      hora_fin: horaFin || null,
      estado,
    });

    setLoading(false);

    if (result) {
      setToast({
        visible: true,
        message: 'Ruta creada correctamente',
        type: 'success',
      });
      setTimeout(() => router.back(), 1500);
    } else {
      setToast({
        visible: true,
        message: 'Error al crear la ruta',
        type: 'error',
      });
    }
  };

  return (
    <View className="flex-1 bg-admin-50">
      <StatusBar barStyle="light-content" backgroundColor="#1d4ed8" />

      {/* Header */}
      <View className="bg-ruta-700 pb-6 px-6 rounded-b-3xl" style={[{ paddingTop }, shadow]}>
        <View className="flex-row items-center justify-between mb-4">
          <TouchableOpacity
            onPress={() => router.back()}
            className="bg-ruta-600 p-2 rounded-lg"
          >
            <ArrowLeft size={24} color="#ffffff" strokeWidth={2.5} />
          </TouchableOpacity>
        </View>

        <View className="flex-row items-center">
          <View className="bg-ruta-600 p-3 rounded-full mr-4">
            <MapPin size={28} color="#ffffff" strokeWidth={2.5} />
          </View>
          <View className="flex-1">
            <Text className="text-white text-2xl font-bold">Nueva Ruta</Text>
            <Text className="text-white text-base mt-1">
              Completa la información de la ruta
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Nombre */}
        <AnimatedCard delay={0} className="mb-4">
          <Text className="text-sm font-semibold text-gray-700 mb-2">
            Nombre de la ruta *
          </Text>
          <View className="flex-row items-center bg-gray-50 rounded-lg px-4 py-3">
            <Type size={20} color="#6b7280" strokeWidth={2} />
            <TextInput
              className="flex-1 ml-3 text-base text-gray-800"
              placeholder="Ej: Ruta Norte"
              placeholderTextColor="#9ca3af"
              value={nombre}
              onChangeText={setNombre}
              autoCapitalize="words"
            />
          </View>
        </AnimatedCard>

        {/* Hora Inicio */}
        <AnimatedCard delay={100} className="mb-4">
          <Text className="text-sm font-semibold text-gray-700 mb-2">
            Hora de inicio (HH:MM)
          </Text>
          <View className="flex-row items-center bg-gray-50 rounded-lg px-4 py-3">
            <Clock size={20} color="#6b7280" strokeWidth={2} />
            <TextInput
              className="flex-1 ml-3 text-base text-gray-800"
              placeholder="Ej: 07:00"
              placeholderTextColor="#9ca3af"
              value={horaInicio}
              onChangeText={setHoraInicio}
              keyboardType="numbers-and-punctuation"
              maxLength={5}
            />
          </View>
        </AnimatedCard>

        {/* Hora Fin */}
        <AnimatedCard delay={150} className="mb-4">
          <Text className="text-sm font-semibold text-gray-700 mb-2">
            Hora de fin (HH:MM)
          </Text>
          <View className="flex-row items-center bg-gray-50 rounded-lg px-4 py-3">
            <Clock size={20} color="#6b7280" strokeWidth={2} />
            <TextInput
              className="flex-1 ml-3 text-base text-gray-800"
              placeholder="Ej: 09:00"
              placeholderTextColor="#9ca3af"
              value={horaFin}
              onChangeText={setHoraFin}
              keyboardType="numbers-and-punctuation"
              maxLength={5}
            />
          </View>
        </AnimatedCard>

        {/* Estado */}
        <AnimatedCard delay={200} className="mb-4">
          <Text className="text-sm font-semibold text-gray-700 mb-2">
            Estado
          </Text>
          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={() => {
                haptic.light();
                setEstado('activa');
              }}
              className={`flex-1 flex-row items-center justify-center rounded-lg px-4 py-3 ${
                estado === 'activa' ? 'bg-green-100' : 'bg-gray-50'
              }`}
            >
              <CheckCircle
                size={20}
                color={estado === 'activa' ? '#16a34a' : '#6b7280'}
                strokeWidth={2}
              />
              <Text
                className={`ml-2 font-semibold ${
                  estado === 'activa' ? 'text-green-700' : 'text-gray-600'
                }`}
              >
                Activa
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                haptic.light();
                setEstado('inactiva');
              }}
              className={`flex-1 flex-row items-center justify-center rounded-lg px-4 py-3 ${
                estado === 'inactiva' ? 'bg-gray-200' : 'bg-gray-50'
              }`}
            >
              <XCircle
                size={20}
                color={estado === 'inactiva' ? '#374151' : '#6b7280'}
                strokeWidth={2}
              />
              <Text
                className={`ml-2 font-semibold ${
                  estado === 'inactiva' ? 'text-gray-700' : 'text-gray-600'
                }`}
              >
                Inactiva
              </Text>
            </TouchableOpacity>
          </View>
        </AnimatedCard>

        {/* Info */}
        <AnimatedCard delay={250} className="mb-4 bg-blue-50">
          <Text className="text-sm text-blue-700">
            💡 Las paradas se agregan después de crear la ruta
          </Text>
        </AnimatedCard>

        {/* Botón Crear */}
        <AnimatedCard delay={300}>
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={loading}
            className={`rounded-xl py-4 flex-row items-center justify-center ${
              loading ? 'bg-ruta-400' : 'bg-ruta-600'
            }`}
            style={shadow}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <>
                <MapPin size={20} color="#ffffff" strokeWidth={2.5} />
                <Text className="text-white font-bold text-lg ml-2">
                  Crear Ruta
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
