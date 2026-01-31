import { Colors } from '@/lib/constants/colors';
import { haptic } from '@/lib/utils/haptics';
import { createShadow } from '@/lib/utils/shadows';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  Check,
  GraduationCap,
  MapPin,
  Search,
  Trash2,
  User,
  X
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
  deleteEstudiante,
  getEstudiantes,
  getPadresParaAsignar,
  getParadasDisponibles,
  updateEstudiante
} from '../../../lib/services/estudiantes.service';

type Padre = {
  id: string;
  nombre: string;
  apellido: string;
  nombreCompleto: string;
};

type Parada = {
  id: string;
  nombre: string | null;
  direccion: string | null;
  orden: number | null;
  ruta: {
    id: string;
    nombre: string;
  } | null;
};

export default function EditarEstudianteScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const paddingTop = Math.max(insets.top + 8, 48);
  const shadow = createShadow('lg');

  // Form state
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [padreSeleccionado, setPadreSeleccionado] = useState<Padre | null>(null);
  const [paradaSeleccionada, setParadaSeleccionada] = useState<Parada | null>(null);

  // Lists
  const [padres, setPadres] = useState<Padre[]>([]);
  const [paradas, setParadas] = useState<Parada[]>([]);

  // UI State
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [showPadresModal, setShowPadresModal] = useState(false);
  const [showParadasModal, setShowParadasModal] = useState(false);
  const [searchPadre, setSearchPadre] = useState('');
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

    // Cargar listas de padres y paradas
    const [padresData, paradasData, estudiantesData] = await Promise.all([
      getPadresParaAsignar(),
      getParadasDisponibles(),
      getEstudiantes(),
    ]);

    // Buscar el estudiante actual
    const estudianteActual = estudiantesData.find((e) => e.id === id);

    if (!estudianteActual) {
      Alert.alert('Error', 'No se encontró el estudiante', [
        { text: 'OK', onPress: () => router.back() },
      ]);
      return;
    }

    // Cargar datos del estudiante
    setNombre(estudianteActual.nombre);
    setApellido(estudianteActual.apellido);

    // Buscar y establecer el padre seleccionado
    if (estudianteActual.id_padre && estudianteActual.padre) {
      const padre = padresData.find((p) => p.id === estudianteActual.id_padre);
      if (padre) {
        setPadreSeleccionado(padre);
      }
    }

    // Buscar y establecer la parada seleccionada
    if (estudianteActual.id_parada && estudianteActual.parada) {
      const parada = paradasData.find((p) => p.id === estudianteActual.id_parada);
      if (parada) {
        setParadaSeleccionada(parada);
      }
    }

    setPadres(padresData);
    setParadas(paradasData);
    setLoadingData(false);
  };

  const filteredPadres = padres.filter((padre) =>
    padre.nombreCompleto.toLowerCase().includes(searchPadre.toLowerCase())
  );

  const handleSelectPadre = (padre: Padre) => {
    haptic.light();
    setPadreSeleccionado(padre);
    setShowPadresModal(false);
    setSearchPadre('');
  };

  const handleSelectParada = (parada: Parada) => {
    haptic.light();
    setParadaSeleccionada(parada);
    setShowParadasModal(false);
  };

  const handleUpdate = async () => {
    // Validaciones
    if (!nombre.trim()) {
      setToast({ visible: true, message: 'Ingresa el nombre', type: 'warning' });
      return;
    }

    if (!apellido.trim()) {
      setToast({ visible: true, message: 'Ingresa el apellido', type: 'warning' });
      return;
    }

    if (!padreSeleccionado) {
      setToast({
        visible: true,
        message: 'Debes seleccionar un padre',
        type: 'warning',
      });
      return;
    }

    haptic.medium();
    setLoading(true);

    const success = await updateEstudiante(id, {
      nombre: nombre.trim(),
      apellido: apellido.trim(),
      id_padre: padreSeleccionado.id,
      id_parada: paradaSeleccionada?.id || null,
    });

    setLoading(false);

    if (success) {
      setToast({
        visible: true,
        message: 'Estudiante actualizado correctamente',
        type: 'success',
      });
      setTimeout(() => router.back(), 1500);
    } else {
      setToast({
        visible: true,
        message: 'No se pudo actualizar el estudiante',
        type: 'error',
      });
    }
  };

  const handleDelete = () => {
    haptic.light();

    Alert.alert(
      'Confirmar eliminación',
      '¿Estás seguro de eliminar este estudiante? Esta acción no se puede deshacer.',
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

            const success = await deleteEstudiante(id);
            setLoading(false);

            if (success) {
              setToast({
                visible: true,
                message: 'Estudiante eliminado correctamente',
                type: 'success',
              });
              setTimeout(() => router.back(), 1500);
            } else {
              setToast({
                visible: true,
                message: 'No se pudo eliminar el estudiante',
                type: 'error',
              });
            }
          },
        },
      ]
    );
  };

  if (loadingData) {
    return (
      <View className="flex-1 bg-admin-50 items-center justify-center">
        <ActivityIndicator size="large" color="#16a34a" />
        <Text className="text-gray-500 mt-4">Cargando datos...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-admin-50">
      <StatusBar barStyle="light-content" backgroundColor={Colors.estudiante[700]} translucent={false} />

      {/* Header */}
      <View className="bg-admin-700 pb-6 px-6 rounded-b-3xl" style={[{ paddingTop }, shadow]}>
        <View className="flex-row items-center justify-between mb-4">
          <TouchableOpacity
            onPress={() => router.back()}
            className="bg-admin-600 p-2 rounded-lg"
          >
            <ArrowLeft size={24} color="#ffffff" strokeWidth={2.5} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleDelete}
            className="bg-red-500 px-4 py-2 rounded-lg flex-row items-center"
            disabled={loading}
          >
            <Trash2 size={18} color="#ffffff" strokeWidth={2.5} />
            <Text className="text-white font-semibold ml-2">Eliminar</Text>
          </TouchableOpacity>
        </View>

        <View className="flex-row items-center">
          <View className="bg-admin-600 p-3 rounded-full mr-4">
            <GraduationCap size={28} color="#ffffff" strokeWidth={2.5} />
          </View>
          <View className="flex-1">
            <Text className="text-white text-2xl font-bold">Editar Estudiante</Text>
            <Text className="text-white text-base mt-1">Actualizar información</Text>
          </View>
        </View>
      </View>

      <ScrollView
        className="flex-1 px-6 pt-6"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Nombre */}
        <AnimatedCard delay={0} className="mb-4">
          <Text className="text-sm font-semibold text-gray-700 mb-2">
            Nombre *
          </Text>
          <TextInput
            className="bg-gray-50 rounded-lg px-4 py-3 text-base text-gray-800"
            placeholder="Ej: Juan"
            placeholderTextColor="#9ca3af"
            value={nombre}
            onChangeText={setNombre}
            autoCapitalize="words"
          />
        </AnimatedCard>

        {/* Apellido */}
        <AnimatedCard delay={100} className="mb-4">
          <Text className="text-sm font-semibold text-gray-700 mb-2">
            Apellido *
          </Text>
          <TextInput
            className="bg-gray-50 rounded-lg px-4 py-3 text-base text-gray-800"
            placeholder="Ej: Pérez"
            placeholderTextColor="#9ca3af"
            value={apellido}
            onChangeText={setApellido}
            autoCapitalize="words"
          />
        </AnimatedCard>

        {/* Padre (Autocomplete) */}
        <AnimatedCard delay={200} className="mb-4">
          <Text className="text-sm font-semibold text-gray-700 mb-2">
            Padre *
          </Text>
          <TouchableOpacity
            onPress={() => setShowPadresModal(true)}
            className="bg-gray-50 rounded-lg px-4 py-3 flex-row items-center justify-between"
          >
            {padreSeleccionado ? (
              <View className="flex-row items-center flex-1">
                <User size={18} color="#16a34a" strokeWidth={2} />
                <Text className="text-base text-gray-800 ml-2">
                  {padreSeleccionado.nombreCompleto}
                </Text>
              </View>
            ) : (
              <Text className="text-base text-gray-400">Seleccionar padre</Text>
            )}
            <Search size={18} color="#9ca3af" strokeWidth={2} />
          </TouchableOpacity>
        </AnimatedCard>

        {/* Parada (Dropdown) */}
        <AnimatedCard delay={300} className="mb-4">
          <Text className="text-sm font-semibold text-gray-700 mb-2">
            Parada (Opcional)
          </Text>
          <TouchableOpacity
            onPress={() => setShowParadasModal(true)}
            className="bg-gray-50 rounded-lg px-4 py-3 flex-row items-center justify-between"
          >
            {paradaSeleccionada ? (
              <View className="flex-1">
                <View className="flex-row items-center">
                  <MapPin size={18} color="#16a34a" strokeWidth={2} />
                  <Text className="text-base text-gray-800 ml-2">
                    {paradaSeleccionada.nombre || 'Sin nombre'}
                  </Text>
                </View>
                {paradaSeleccionada.ruta && (
                  <Text className="text-xs text-gray-500 ml-6 mt-1">
                    Ruta: {paradaSeleccionada.ruta.nombre}
                  </Text>
                )}
              </View>
            ) : (
              <Text className="text-base text-gray-400">Sin parada asignada</Text>
            )}
            {paradaSeleccionada && (
              <TouchableOpacity onPress={() => setParadaSeleccionada(null)}>
                <X size={18} color="#9ca3af" strokeWidth={2} />
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        </AnimatedCard>

        {/* Botón Actualizar */}
        <TouchableOpacity
          onPress={handleUpdate}
          disabled={loading}
          className={`bg-admin-600 rounded-xl py-4 mb-8 mt-4 ${
            loading ? 'opacity-60' : ''
          }`}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <View className="flex-row items-center justify-center">
              <Check size={20} color="#ffffff" strokeWidth={2.5} />
              <Text className="text-white text-lg font-bold ml-2">
                Actualizar Estudiante
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Modal Seleccionar Padre */}
      <Modal
        visible={showPadresModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPadresModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl" style={{ maxHeight: '80%' }}>
            <View className="p-6 border-b border-gray-200">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-xl font-bold text-gray-800">
                  Seleccionar Padre
                </Text>
                <TouchableOpacity
                  onPress={() => setShowPadresModal(false)}
                  className="bg-gray-100 p-2 rounded-lg"
                >
                  <X size={20} color="#374151" strokeWidth={2} />
                </TouchableOpacity>
              </View>

              <View className="bg-gray-50 rounded-lg flex-row items-center px-3 py-2">
                <Search size={18} color="#9ca3af" strokeWidth={2} />
                <TextInput
                  className="flex-1 ml-2 text-base"
                  placeholder="Buscar padre..."
                  placeholderTextColor="#9ca3af"
                  value={searchPadre}
                  onChangeText={setSearchPadre}
                  autoCapitalize="words"
                />
              </View>
            </View>

            <FlatList
              data={filteredPadres}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => handleSelectPadre(item)}
                  className="px-6 py-4 border-b border-gray-100 flex-row items-center"
                >
                  <View className="bg-estudiante-100 p-2 rounded-full mr-3">
                    <User size={20} color="#2563eb" strokeWidth={2} />
                  </View>
                  <Text className="text-base text-gray-800 flex-1">
                    {item.nombreCompleto}
                  </Text>
                  {padreSeleccionado?.id === item.id && (
                    <Check size={20} color="#16a34a" strokeWidth={2.5} />
                  )}
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View className="py-12 items-center">
                  <Text className="text-gray-500">No se encontraron padres</Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>

      {/* Modal Seleccionar Parada */}
      <Modal
        visible={showParadasModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowParadasModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl" style={{ maxHeight: '70%' }}>
            <View className="p-6 border-b border-gray-200 flex-row items-center justify-between">
              <Text className="text-xl font-bold text-gray-800">
                Seleccionar Parada
              </Text>
              <TouchableOpacity
                onPress={() => setShowParadasModal(false)}
                className="bg-gray-100 p-2 rounded-lg"
              >
                <X size={20} color="#374151" strokeWidth={2} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={paradas}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => handleSelectParada(item)}
                  className="px-6 py-4 border-b border-gray-100"
                >
                  <View className="flex-row items-center">
                    <View className="bg-amber-100 p-2 rounded-full mr-3">
                      <MapPin size={20} color="#f59e0b" strokeWidth={2} />
                    </View>
                    <View className="flex-1">
                      <Text className="text-base text-gray-800 font-semibold">
                        {item.nombre || 'Sin nombre'}
                      </Text>
                      {item.ruta && (
                        <Text className="text-sm text-gray-500 mt-1">
                          Ruta: {item.ruta.nombre}
                        </Text>
                      )}
                      {item.direccion && (
                        <Text className="text-xs text-gray-400 mt-1">
                          {item.direccion}
                        </Text>
                      )}
                    </View>
                    {paradaSeleccionada?.id === item.id && (
                      <Check size={20} color="#16a34a" strokeWidth={2.5} />
                    )}
                  </View>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View className="py-12 items-center">
                  <Text className="text-gray-500">No hay paradas disponibles</Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>

      {/* Toast */}
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast({ ...toast, visible: false })}
      />
    </View>
  );
}
