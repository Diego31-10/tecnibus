import { haptic } from '@/lib/utils/haptics';
import { createShadow } from '@/lib/utils/shadows';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  ArrowLeft,
  GraduationCap,
  MapPin,
  Plus,
  Search,
  User,
  UserX
} from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedCard } from '../../../components';
import {
  Estudiante,
  getEstudiantes
} from '../../../lib/services/estudiantes.service';

export default function EstudiantesListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const paddingTop = Math.max(insets.top + 8, 48);
  const shadow = createShadow('lg');
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
  const [filteredEstudiantes, setFilteredEstudiantes] = useState<Estudiante[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Cargar estudiantes cuando la pantalla recibe foco
  useFocusEffect(
    useCallback(() => {
      loadEstudiantes();
    }, [])
  );

  useEffect(() => {
    handleSearch(searchQuery);
  }, [searchQuery, estudiantes]);

  const loadEstudiantes = async () => {
    try {
      setLoading(true);
      const data = await getEstudiantes();
      setEstudiantes(data);
      setFilteredEstudiantes(data);
    } catch (error) {
      console.error('❌ Error cargando estudiantes:', error);
      setEstudiantes([]);
      setFilteredEstudiantes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadEstudiantes();
    setRefreshing(false);
  };

  const handleSearch = (query: string) => {
    const trimmed = query.trim().toLowerCase();

    if (!trimmed) {
      setFilteredEstudiantes(estudiantes);
      return;
    }

    const filtered = estudiantes.filter(
      (est) =>
        est.nombre.toLowerCase().includes(trimmed) ||
        est.apellido.toLowerCase().includes(trimmed) ||
        (est.padre?.nombre.toLowerCase().includes(trimmed)) ||
        (est.padre?.apellido.toLowerCase().includes(trimmed))
    );

    setFilteredEstudiantes(filtered);
  };

  const handleCrearEstudiante = () => {
    haptic.medium();
    router.push('/admin/estudiantes/crear');
  };

  const handleEditarEstudiante = (id: string) => {
    haptic.light();
    router.push(`/admin/estudiantes/${id}` as any);
  };

  const renderEstudiante = ({ item, index }: { item: Estudiante; index: number }) => (
    <AnimatedCard delay={index * 50} className="mb-3">
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => handleEditarEstudiante(item.id)}
      >
        <View className="flex-row items-start">
        {/* Avatar */}
        <View className="bg-estudiante-100 p-3 rounded-full mr-3">
          <GraduationCap size={24} color="#2563eb" strokeWidth={2} />
        </View>

        {/* Info del Estudiante */}
        <View className="flex-1">
          <Text className="text-lg font-bold text-gray-800">
            {item.nombre} {item.apellido}
          </Text>

          {/* Padre asignado */}
          <View className="flex-row items-center mt-2">
            {item.padre ? (
              <>
                <User size={14} color="#6b7280" strokeWidth={2} />
                <Text className="text-sm text-gray-600 ml-1">
                  Padre: {item.padre.nombre} {item.padre.apellido}
                </Text>
              </>
            ) : (
              <>
                <UserX size={14} color="#ef4444" strokeWidth={2} />
                <Text className="text-sm text-red-500 ml-1">Sin padre asignado</Text>
              </>
            )}
          </View>

        {/* Ruta asignada */}
          <View className="flex-row items-center mt-1">
            {item.ruta ? (
              <>
                <MapPin size={14} color="#6b7280" strokeWidth={2} />
                <Text className="text-sm text-gray-600 ml-1">
                  Ruta: {item.ruta.nombre}
                </Text>
              </>
            ) : (
              <>
                <MapPin size={14} color="#f59e0b" strokeWidth={2} />
                <Text className="text-sm text-amber-600 ml-1">Sin ruta asignada</Text>
              </>
            )}
          </View>
        </View>
        </View>
      </TouchableOpacity>
    </AnimatedCard>
  );

  const renderEmpty = () => (
    <View className="items-center justify-center py-12">
      <View className="bg-gray-100 p-6 rounded-full mb-4">
        <GraduationCap size={48} color="#9ca3af" strokeWidth={1.5} />
      </View>
      <Text className="text-lg font-semibold text-gray-700 mb-2">
        {searchQuery ? 'No se encontraron estudiantes' : 'No hay estudiantes registrados'}
      </Text>
      <Text className="text-sm text-gray-500 text-center px-8">
        {searchQuery
          ? 'Intenta con otro término de búsqueda'
          : 'Comienza agregando el primer estudiante'}
      </Text>
    </View>
  );

  return (
    <View className="flex-1 bg-admin-50">
      <StatusBar barStyle="light-content" backgroundColor="#166534" />

      {/* Header */}
      <View className="bg-estudiante-700 pb-6 px-6 rounded-b-3xl" style={[{ paddingTop }, shadow]}>
        <View className="flex-row items-center justify-between mb-4">
          <TouchableOpacity
            onPress={() => router.back()}
            className="bg-estudiante-600 p-2 rounded-lg"
          >
            <ArrowLeft size={24} color="#ffffff" strokeWidth={2.5} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleCrearEstudiante}
            className="bg-estudiante-600 px-4 py-2 rounded-lg flex-row items-center"
          >
            <Plus size={20} color="#ffffff" strokeWidth={2.5} />
            <Text className="text-white font-semibold ml-1">Nuevo</Text>
          </TouchableOpacity>
        </View>

        <View className="flex-row items-center">
          <View className="bg-estudiante-600 p-3 rounded-full mr-4">
            <GraduationCap size={28} color="#ffffff" strokeWidth={2.5} />
          </View>
          <View className="flex-1">
            <Text className="text-white text-2xl font-bold">Estudiantes</Text>
            <Text className="text-white text-base mt-1">
              {filteredEstudiantes.length}{' '}
              {filteredEstudiantes.length === 1 ? 'estudiante' : 'estudiantes'}
            </Text>
          </View>
        </View>
      </View>

      {/* Barra de búsqueda */}
      <View className="px-6 pt-6 pb-3">
        <View className="bg-white rounded-xl shadow-sm flex-row items-center px-4 py-3">
          <Search size={20} color="#9ca3af" strokeWidth={2} />
          <TextInput
            className="flex-1 ml-3 text-base text-gray-800"
            placeholder="Buscar estudiante..."
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="words"
          />
        </View>
      </View>

      {/* Lista de estudiantes */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#16a34a" />
          <Text className="text-gray-500 mt-4">Cargando estudiantes...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredEstudiantes}
          renderItem={renderEstudiante}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmpty}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#16a34a']}
              tintColor="#16a34a"
            />
          }
        />
      )}
    </View>
  );
}
