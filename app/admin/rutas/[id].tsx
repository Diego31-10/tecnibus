import { Colors } from '@/lib/constants/colors';
import { haptic } from '@/lib/utils/haptics';
import { createShadow } from '@/lib/utils/shadows';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  Edit2,
  MapPin,
  Navigation,
  Plus,
  Trash2,
  Type,
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
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedCard } from '../../../components';
import Toast from '../../../components/Toast';
import {
  Parada,
  createParada,
  deleteParada,
  deleteRuta,
  getRutaById,
  updateParada,
  updateRuta
} from '../../../lib/services/rutas.service';

type ParadaForm = {
  nombre: string;
  direccion: string;
  latitud: string;
  longitud: string;
  hora_aprox: string;
  orden: string;
};

export default function EditarRutaScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const paddingTop = Math.max(insets.top + 8, 48);
  const shadow = createShadow('lg');

  // Form state - Ruta
  const [nombre, setNombre] = useState('');
  const [horaInicio, setHoraInicio] = useState('');
  const [horaFin, setHoraFin] = useState('');
  const [estado, setEstado] = useState<'activa' | 'inactiva'>('activa');

  // Paradas
  const [paradas, setParadas] = useState<Parada[]>([]);

  // Modal de paradas
  const [showParadaModal, setShowParadaModal] = useState(false);
  const [editingParada, setEditingParada] = useState<Parada | null>(null);
  const [paradaForm, setParadaForm] = useState<ParadaForm>({
    nombre: '',
    direccion: '',
    latitud: '',
    longitud: '',
    hora_aprox: '',
    orden: '1',
  });

  // UI State
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [loadingParadas, setLoadingParadas] = useState(false);
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
  }>({
    visible: false,
    message: '',
    type: 'success',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoadingData(true);

    const rutaData = await getRutaById(id);

    if (!rutaData) {
      Alert.alert('Error', 'No se encontró la ruta', [
        { text: 'OK', onPress: () => router.back() },
      ]);
      return;
    }

    // Cargar datos de la ruta
    setNombre(rutaData.nombre);
    setHoraInicio(rutaData.hora_inicio || '');
    setHoraFin(rutaData.hora_fin || '');
    setEstado((rutaData.estado as 'activa' | 'inactiva') || 'activa');
    setParadas(rutaData.paradas || []);

    setLoadingData(false);
  };

  const validateTime = (time: string): boolean => {
    const regex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return regex.test(time);
  };

  const handleUpdateRuta = async () => {
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

    const success = await updateRuta(id, {
      nombre: nombre.trim(),
      hora_inicio: horaInicio || null,
      hora_fin: horaFin || null,
      estado,
    });

    setLoading(false);

    if (success) {
      setToast({
        visible: true,
        message: 'Ruta actualizada correctamente',
        type: 'success',
      });
    } else {
      setToast({
        visible: true,
        message: 'No se pudo actualizar la ruta',
        type: 'error',
      });
    }
  };

  const handleDeleteRuta = () => {
    haptic.light();

    Alert.alert(
      'Confirmar eliminación',
      '¿Estás seguro de eliminar esta ruta? Se eliminarán todas sus paradas. Esta acción no se puede deshacer.',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            haptic.heavy();
            setLoading(true);

            const result = await deleteRuta(id);
            setLoading(false);

            if (result.success) {
              setToast({
                visible: true,
                message: 'Ruta eliminada correctamente',
                type: 'success',
              });
              setTimeout(() => router.back(), 1500);
            } else {
              setToast({
                visible: true,
                message: result.error || 'No se pudo eliminar la ruta',
                type: 'error',
              });
            }
          },
        },
      ]
    );
  };

  // PARADAS

  const handleAgregarParada = () => {
    haptic.light();
    setEditingParada(null);
    setParadaForm({
      nombre: '',
      direccion: '',
      latitud: '',
      longitud: '',
      hora_aprox: '',
      orden: String(paradas.length + 1),
    });
    setShowParadaModal(true);
  };

  const handleEditarParada = (parada: Parada) => {
    haptic.light();
    setEditingParada(parada);
    setParadaForm({
      nombre: parada.nombre || '',
      direccion: parada.direccion || '',
      latitud: String(parada.latitud),
      longitud: String(parada.longitud),
      hora_aprox: parada.hora_aprox || '',
      orden: String(parada.orden || 1),
    });
    setShowParadaModal(true);
  };

  const handleSaveParada = async () => {
    // Validaciones
    if (!paradaForm.nombre.trim()) {
      setToast({ visible: true, message: 'Ingresa el nombre de la parada', type: 'warning' });
      return;
    }

    if (!paradaForm.direccion.trim()) {
      setToast({ visible: true, message: 'Ingresa la dirección', type: 'warning' });
      return;
    }

    const lat = parseFloat(paradaForm.latitud);
    if (isNaN(lat) || lat < -90 || lat > 90) {
      setToast({
        visible: true,
        message: 'Latitud debe estar entre -90 y 90',
        type: 'warning',
      });
      return;
    }

    const lng = parseFloat(paradaForm.longitud);
    if (isNaN(lng) || lng < -180 || lng > 180) {
      setToast({
        visible: true,
        message: 'Longitud debe estar entre -180 y 180',
        type: 'warning',
      });
      return;
    }

    const orden = parseInt(paradaForm.orden);
    if (isNaN(orden) || orden <= 0) {
      setToast({
        visible: true,
        message: 'El orden debe ser un número mayor a 0',
        type: 'warning',
      });
      return;
    }

    haptic.medium();
    setLoadingParadas(true);

    let success = false;

    if (editingParada) {
      // Actualizar
      success = await updateParada(editingParada.id, {
        nombre: paradaForm.nombre.trim(),
        direccion: paradaForm.direccion.trim(),
        latitud: lat,
        longitud: lng,
        hora_aprox: paradaForm.hora_aprox || null,
        orden,
      });
    } else {
      // Crear
      const result = await createParada({
        id_ruta: id,
        nombre: paradaForm.nombre.trim(),
        direccion: paradaForm.direccion.trim(),
        latitud: lat,
        longitud: lng,
        hora_aprox: paradaForm.hora_aprox || null,
        orden,
      });
      success = result !== null;
    }

    setLoadingParadas(false);

    if (success) {
      setToast({
        visible: true,
        message: editingParada ? 'Parada actualizada' : 'Parada creada',
        type: 'success',
      });
      setShowParadaModal(false);
      // Recargar paradas
      const rutaData = await getRutaById(id);
      if (rutaData) {
        setParadas(rutaData.paradas || []);
      }
    } else {
      setToast({
        visible: true,
        message: 'Error al guardar la parada',
        type: 'error',
      });
    }
  };

  const handleDeleteParada = (paradaId: string) => {
    haptic.light();

    Alert.alert(
      'Confirmar eliminación',
      '¿Estás seguro de eliminar esta parada?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            haptic.heavy();
            setLoadingParadas(true);

            const success = await deleteParada(paradaId);
            setLoadingParadas(false);

            if (success) {
              setToast({
                visible: true,
                message: 'Parada eliminada',
                type: 'success',
              });
              // Recargar paradas
              const rutaData = await getRutaById(id);
              if (rutaData) {
                setParadas(rutaData.paradas || []);
              }
            } else {
              setToast({
                visible: true,
                message: 'No se pudo eliminar la parada',
                type: 'error',
              });
            }
          },
        },
      ]
    );
  };

  const renderParada = ({ item }: { item: Parada }) => (
    <View className="bg-white rounded-lg p-3 mb-2 flex-row items-center justify-between">
      <View className="flex-1">
        <View className="flex-row items-center mb-1">
          <View className="bg-ruta-100 px-2 py-1 rounded">
            <Text className="text-xs font-bold text-ruta-700">#{item.orden}</Text>
          </View>
          <Text className="text-base font-bold text-gray-800 ml-2 flex-1">
            {item.nombre}
          </Text>
        </View>
        <Text className="text-sm text-gray-600">{item.direccion}</Text>
        <Text className="text-xs text-gray-500 mt-1">
          📍 {item.latitud.toFixed(6)}, {item.longitud.toFixed(6)}
        </Text>
        {item.hora_aprox && (
          <Text className="text-xs text-gray-500">⏰ {item.hora_aprox}</Text>
        )}
      </View>

      <View className="flex-row gap-2 ml-2">
        <TouchableOpacity
          onPress={() => handleEditarParada(item)}
          className="bg-blue-100 p-2 rounded-lg"
        >
          <Edit2 size={16} color="#2563eb" strokeWidth={2} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleDeleteParada(item.id)}
          className="bg-red-100 p-2 rounded-lg"
        >
          <Trash2 size={16} color="#dc2626" strokeWidth={2} />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loadingData) {
    return (
      <View className="flex-1 bg-admin-50 items-center justify-center">
        <StatusBar barStyle="light-content" backgroundColor={Colors.ruta[700]} translucent={false} />
        <ActivityIndicator size="large" color="#dc2626" />
        <Text className="text-gray-500 mt-4">Cargando datos...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-admin-50">
      <StatusBar barStyle="light-content" backgroundColor="#b91c1c" translucent={false} />

      {/* Header */}
      <View className="bg-ruta-700 pb-6 px-6 rounded-b-3xl" style={[{ paddingTop }, shadow]}>
        <View className="flex-row items-center justify-between mb-4">
          <TouchableOpacity
            onPress={() => router.back()}
            className="bg-ruta-600 p-2 rounded-lg"
          >
            <ArrowLeft size={24} color="#ffffff" strokeWidth={2.5} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleDeleteRuta}
            className="bg-red-600 p-2 rounded-lg"
          >
            <Trash2 size={24} color="#ffffff" strokeWidth={2.5} />
          </TouchableOpacity>
        </View>

        <View className="flex-row items-center">
          <View className="bg-ruta-600 p-3 rounded-full mr-4">
            <MapPin size={28} color="#ffffff" strokeWidth={2.5} />
          </View>
          <View className="flex-1">
            <Text className="text-white text-2xl font-bold">Editar Ruta</Text>
            <Text className="text-white text-base mt-1">
              Actualiza la información de la ruta
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Información de la Ruta */}
        <AnimatedCard delay={0} className="mb-4">
          <Text className="text-lg font-bold text-gray-800 mb-3">Información de la Ruta</Text>

          {/* Nombre */}
          <Text className="text-sm font-semibold text-gray-700 mb-2">
            Nombre *
          </Text>
          <View className="flex-row items-center bg-gray-50 rounded-lg px-4 py-3 mb-4">
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

          {/* Hora Inicio */}
          <Text className="text-sm font-semibold text-gray-700 mb-2">
            Hora de inicio (HH:MM)
          </Text>
          <View className="flex-row items-center bg-gray-50 rounded-lg px-4 py-3 mb-4">
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

          {/* Hora Fin */}
          <Text className="text-sm font-semibold text-gray-700 mb-2">
            Hora de fin (HH:MM)
          </Text>
          <View className="flex-row items-center bg-gray-50 rounded-lg px-4 py-3 mb-4">
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

          {/* Estado */}
          <Text className="text-sm font-semibold text-gray-700 mb-2">
            Estado
          </Text>
          <View className="flex-row gap-3 mb-4">
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

          {/* Botón Actualizar Ruta */}
          <TouchableOpacity
            onPress={handleUpdateRuta}
            disabled={loading}
            className={`rounded-xl py-3 flex-row items-center justify-center ${
              loading ? 'bg-ruta-400' : 'bg-ruta-600'
            }`}
            style={shadow}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <>
                <MapPin size={18} color="#ffffff" strokeWidth={2.5} />
                <Text className="text-white font-bold ml-2">
                  Actualizar Ruta
                </Text>
              </>
            )}
          </TouchableOpacity>
        </AnimatedCard>

        {/* Gestión de Paradas */}
        <AnimatedCard delay={100} className="mb-4">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-lg font-bold text-gray-800">
              Paradas de esta Ruta
            </Text>
            <TouchableOpacity
              onPress={handleAgregarParada}
              className="bg-ruta-600 px-3 py-2 rounded-lg flex-row items-center"
            >
              <Plus size={16} color="#ffffff" strokeWidth={2.5} />
              <Text className="text-white font-semibold ml-1 text-sm">Agregar</Text>
            </TouchableOpacity>
          </View>

          {loadingParadas ? (
            <ActivityIndicator size="small" color="#2563eb" />
          ) : paradas.length === 0 ? (
            <View className="items-center py-6">
              <Navigation size={32} color="#9ca3af" strokeWidth={1.5} />
              <Text className="text-gray-500 mt-2">No hay paradas agregadas</Text>
            </View>
          ) : (
            <FlatList
              data={paradas}
              renderItem={renderParada}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
          )}
        </AnimatedCard>
      </ScrollView>

      {/* Modal de Parada */}
      <Modal
        visible={showParadaModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowParadaModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-6" style={{ maxHeight: '90%' }}>
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-xl font-bold text-gray-800">
                {editingParada ? 'Editar Parada' : 'Nueva Parada'}
              </Text>
              <TouchableOpacity onPress={() => setShowParadaModal(false)}>
                <XCircle size={24} color="#6b7280" strokeWidth={2} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Nombre */}
              <Text className="text-sm font-semibold text-gray-700 mb-2">Nombre *</Text>
              <View className="flex-row items-center bg-gray-50 rounded-lg px-4 py-3 mb-3">
                <Type size={20} color="#6b7280" strokeWidth={2} />
                <TextInput
                  className="flex-1 ml-3 text-base text-gray-800"
                  placeholder="Ej: Parada Central"
                  value={paradaForm.nombre}
                  onChangeText={(text) => setParadaForm({ ...paradaForm, nombre: text })}
                />
              </View>

              {/* Dirección */}
              <Text className="text-sm font-semibold text-gray-700 mb-2">Dirección *</Text>
              <View className="flex-row items-center bg-gray-50 rounded-lg px-4 py-3 mb-3">
                <Navigation size={20} color="#6b7280" strokeWidth={2} />
                <TextInput
                  className="flex-1 ml-3 text-base text-gray-800"
                  placeholder="Ej: Calle 123 #45-67"
                  value={paradaForm.direccion}
                  onChangeText={(text) => setParadaForm({ ...paradaForm, direccion: text })}
                />
              </View>

              {/* Latitud */}
              <Text className="text-sm font-semibold text-gray-700 mb-2">Latitud *</Text>
              <TextInput
                className="bg-gray-50 rounded-lg px-4 py-3 mb-3 text-base text-gray-800"
                placeholder="Ej: 4.6097"
                value={paradaForm.latitud}
                onChangeText={(text) => setParadaForm({ ...paradaForm, latitud: text })}
                keyboardType="numeric"
              />

              {/* Longitud */}
              <Text className="text-sm font-semibold text-gray-700 mb-2">Longitud *</Text>
              <TextInput
                className="bg-gray-50 rounded-lg px-4 py-3 mb-3 text-base text-gray-800"
                placeholder="Ej: -74.0817"
                value={paradaForm.longitud}
                onChangeText={(text) => setParadaForm({ ...paradaForm, longitud: text })}
                keyboardType="numeric"
              />

              {/* Hora Aprox */}
              <Text className="text-sm font-semibold text-gray-700 mb-2">Hora aproximada (HH:MM)</Text>
              <View className="flex-row items-center bg-gray-50 rounded-lg px-4 py-3 mb-3">
                <Clock size={20} color="#6b7280" strokeWidth={2} />
                <TextInput
                  className="flex-1 ml-3 text-base text-gray-800"
                  placeholder="Ej: 07:30"
                  value={paradaForm.hora_aprox}
                  onChangeText={(text) => setParadaForm({ ...paradaForm, hora_aprox: text })}
                  keyboardType="numbers-and-punctuation"
                  maxLength={5}
                />
              </View>

              {/* Orden */}
              <Text className="text-sm font-semibold text-gray-700 mb-2">Orden *</Text>
              <TextInput
                className="bg-gray-50 rounded-lg px-4 py-3 mb-4 text-base text-gray-800"
                placeholder="Ej: 1"
                value={paradaForm.orden}
                onChangeText={(text) => setParadaForm({ ...paradaForm, orden: text })}
                keyboardType="numeric"
              />

              {/* Botón Guardar */}
              <TouchableOpacity
                onPress={handleSaveParada}
                disabled={loadingParadas}
                className={`rounded-xl py-4 flex-row items-center justify-center ${
                  loadingParadas ? 'bg-ruta-400' : 'bg-ruta-600'
                }`}
                style={shadow}
              >
                {loadingParadas ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <>
                    <Navigation size={20} color="#ffffff" strokeWidth={2.5} />
                    <Text className="text-white font-bold text-lg ml-2">
                      {editingParada ? 'Actualizar' : 'Guardar'} Parada
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast({ ...toast, visible: false })}
      />
    </View>
  );
}
