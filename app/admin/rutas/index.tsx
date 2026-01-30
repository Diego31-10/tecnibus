import { Colors } from '@/lib/constants/colors';
import { haptic } from '@/lib/utils/haptics';
import { createShadow } from '@/lib/utils/shadows';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  ArrowLeft,
  Clock,
  MapPin,
  Plus,
  Search
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
  Ruta,
  getRutas
} from '../../../lib/services/rutas.service';

export default function RutasListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const paddingTop = Math.max(insets.top + 8, 48);
  const shadow = createShadow('lg');
  const [rutas, setRutas] = useState<Ruta[]>([]);
  const [filteredRutas, setFilteredRutas] = useState<Ruta[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Cargar rutas cuando la pantalla recibe foco
  useFocusEffect(
    useCallback(() => {
      loadRutas();
    }, [])
  );

  useEffect(() => {
    handleSearch(searchQuery);
  }, [searchQuery, rutas]);

  const loadRutas = async () => {
    try {
      setLoading(true);
      const data = await getRutas();
      setRutas(data);
      setFilteredRutas(data);
    } catch (error) {
      console.error('❌ Error cargando rutas:', error);
      setRutas([]);
      setFilteredRutas([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadRutas();
    setRefreshing(false);
  };

  const handleSearch = (query: string) => {
    const trimmed = query.trim().toLowerCase();

    if (!trimmed) {
      setFilteredRutas(rutas);
      return;
    }

    const filtered = rutas.filter(
      (ruta) => ruta.nombre.toLowerCase().includes(trimmed)
    );

    setFilteredRutas(filtered);
  };

  const handleCrearRuta = () => {
    haptic.medium();
    router.push('/admin/rutas/crear');
  };

  const handleEditarRuta = (id: string) => {
    haptic.light();
    router.push(`/admin/rutas/${id}` as any);
  };

  const renderRuta = ({ item, index }: { item: Ruta; index: number }) => {
    const numParadas = item.paradas?.length || 0;
    const estadoActiva = item.estado === 'activa';

    return (
      <AnimatedCard delay={index * 50} className="mb-3">
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => handleEditarRuta(item.id)}
        >
          <View className="flex-row items-start">
            {/* Icono */}
            <View className="bg-ruta-100 p-3 rounded-full mr-3">
              <MapPin size={24} color="#dc2626" strokeWidth={2} />
            </View>

            {/* Info de la Ruta */}
            <View className="flex-1">
              <View className="flex-row items-center justify-between">
                <Text className="text-lg font-bold text-gray-800 flex-1">
                  {item.nombre}
                </Text>

                {/* Badge de estado */}
                <View className={`px-2 py-1 rounded-full ${estadoActiva ? 'bg-green-100' : 'bg-gray-200'}`}>
                  <Text className={`text-xs font-semibold ${estadoActiva ? 'text-green-700' : 'text-gray-600'}`}>
                    {estadoActiva ? 'Activa' : 'Inactiva'}
                  </Text>
                </View>
              </View>

              {/* Horario */}
              {(item.hora_inicio || item.hora_fin) && (
                <View className="flex-row items-center mt-2">
                  <Clock size={14} color="#6b7280" strokeWidth={2} />
                  <Text className="text-sm text-gray-600 ml-1">
                    {item.hora_inicio || '00:00'} - {item.hora_fin || '00:00'}
                  </Text>
                </View>
              )}

              {/* Número de paradas */}
              <View className="flex-row items-center mt-1">
                <MapPin size={14} color="#6b7280" strokeWidth={2} />
                <Text className="text-sm text-gray-600 ml-1">
                  {numParadas} {numParadas === 1 ? 'parada' : 'paradas'}
                </Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </AnimatedCard>
    );
  };

  const renderEmpty = () => (
    <View className="items-center justify-center py-12">
      <View className="bg-gray-100 p-6 rounded-full mb-4">
        <MapPin size={48} color="#9ca3af" strokeWidth={1.5} />
      </View>
      <Text className="text-lg font-semibold text-gray-700 mb-2">
        {searchQuery ? 'No se encontraron rutas' : 'No hay rutas registradas'}
      </Text>
      <Text className="text-sm text-gray-500 text-center px-8">
        {searchQuery
          ? 'Intenta con otro término de búsqueda'
          : 'Comienza agregando la primera ruta'}
      </Text>
    </View>
  );

  return (
    <View className="flex-1 bg-admin-50">
      <StatusBar barStyle="light-content" backgroundColor={Colors.ruta[700]} translucent={false} />

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
            onPress={handleCrearRuta}
            className="bg-ruta-600 px-4 py-2 rounded-lg flex-row items-center"
          >
            <Plus size={20} color="#ffffff" strokeWidth={2.5} />
            <Text className="text-white font-semibold ml-1">Nueva</Text>
          </TouchableOpacity>
        </View>

        <View className="flex-row items-center">
          <View className="bg-ruta-600 p-3 rounded-full mr-4">
            <MapPin size={28} color="#ffffff" strokeWidth={2.5} />
          </View>
          <View className="flex-1">
            <Text className="text-white text-2xl font-bold">Rutas</Text>
            <Text className="text-white text-base mt-1">
              {filteredRutas.length}{' '}
              {filteredRutas.length === 1 ? 'ruta' : 'rutas'}
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
            placeholder="Buscar ruta..."
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="words"
          />
        </View>
      </View>

      {/* Lista de rutas */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#dc2626" />
          <Text className="text-gray-500 mt-4">Cargando rutas...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredRutas}
          renderItem={renderRuta}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmpty}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#dc2626']}
              tintColor="#dc2626"
            />
          }
        />
      )}
    </View>
  );
}
