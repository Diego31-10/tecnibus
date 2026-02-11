import { Colors } from "@/lib/constants/colors";
import { haptic } from "@/lib/utils/haptics";
import { createShadow } from "@/lib/utils/shadows";
import { useFocusEffect, useRouter } from "expo-router";
import { ArrowLeft, Bus, Plus, Search, Users } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    StatusBar,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AnimatedCard } from "../../../components";
import { Buseta, getBusetas } from "../../../lib/services/busetas.service";

export default function BusetasListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const paddingTop = Math.max(insets.top + 8, 48);
  const shadow = createShadow("lg");
  const [busetas, setBusetas] = useState<Buseta[]>([]);
  const [filteredBusetas, setFilteredBusetas] = useState<Buseta[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Cargar busetas cuando la pantalla recibe foco
  useFocusEffect(
    useCallback(() => {
      loadBusetas();
    }, []),
  );

  useEffect(() => {
    handleSearch(searchQuery);
  }, [searchQuery, busetas]);

  const loadBusetas = async () => {
    try {
      setLoading(true);
      const data = await getBusetas();
      setBusetas(data);
      setFilteredBusetas(data);
    } catch (error) {
      console.error("❌ Error cargando busetas:", error);
      setBusetas([]);
      setFilteredBusetas([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadBusetas();
    setRefreshing(false);
  };

  const handleSearch = (query: string) => {
    const trimmed = query.trim().toLowerCase();

    if (!trimmed) {
      setFilteredBusetas(busetas);
      return;
    }

    const filtered = busetas.filter((buseta) =>
      buseta.placa.toLowerCase().includes(trimmed),
    );

    setFilteredBusetas(filtered);
  };

  const handleCrearBuseta = () => {
    haptic.medium();
    router.push("/admin/busetas/crear");
  };

  const handleEditarBuseta = (id: string) => {
    haptic.light();
    router.push(`/admin/busetas/${id}` as any);
  };

  const renderBuseta = ({ item, index }: { item: Buseta; index: number }) => (
    <AnimatedCard delay={index * 50} className="mb-3">
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => handleEditarBuseta(item.id)}
      >
        <View className="flex-row items-center">
          {/* Icono */}
          <View className="bg-buseta-100 p-3 rounded-full mr-3">
            <Bus size={24} color="#16a34a" strokeWidth={2} />
          </View>

          {/* Info de la Buseta */}
          <View className="flex-1">
            <Text className="text-lg font-bold text-gray-800">
              {item.placa}
            </Text>

            {/* Capacidad */}
            <View className="flex-row items-center mt-1">
              <Users size={14} color="#6b7280" strokeWidth={2} />
              <Text className="text-sm text-gray-600 ml-1">
                Capacidad: {item.capacidad} pasajeros
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </AnimatedCard>
  );

  const renderEmpty = () => (
    <View className="items-center justify-center py-12">
      <View className="bg-gray-100 p-6 rounded-full mb-4">
        <Bus size={48} color="#9ca3af" strokeWidth={1.5} />
      </View>
      <Text className="text-lg font-semibold text-gray-700 mb-2">
        {searchQuery
          ? "No se encontraron busetas"
          : "No hay busetas registradas"}
      </Text>
      <Text className="text-sm text-gray-500 text-center px-8">
        {searchQuery
          ? "Intenta con otro término de búsqueda"
          : "Comienza agregando la primera buseta"}
      </Text>
    </View>
  );

  return (
    <View className="flex-1 bg-admin-50">
      <StatusBar
        barStyle="light-content"
        backgroundColor={Colors.tecnibus[700]}
        translucent={false}
      />

      {/* Header */}
      <View
        className="bg-buseta-700 pb-6 px-6 rounded-b-3xl"
        style={[{ paddingTop }, shadow]}
      >
        <View className="flex-row items-center">
          <TouchableOpacity
            className="bg-buseta-600 p-2 rounded-xl"
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color="#ffffff" strokeWidth={2.5} />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-white text-2xl font-bold text-center">
              Busetas
            </Text>
            <Text className="text-white text-xl mt-1 text-center">
              {filteredBusetas.length}{" "}
              {filteredBusetas.length === 1 ? "buseta" : "busetas"}
            </Text>
          </View>
          <TouchableOpacity
            className="bg-buseta-600 p-2 rounded-xl"
            onPress={handleCrearBuseta}
          >
            <Plus size={24} color="#ffffff" strokeWidth={2.5} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Barra de búsqueda */}
      <View className="px-6 pt-6 pb-3">
        <View className="bg-white rounded-xl shadow-sm flex-row items-center px-4 py-3">
          <Search size={20} color="#9ca3af" strokeWidth={2} />
          <TextInput
            className="flex-1 ml-3 text-base text-gray-800"
            placeholder="Buscar por placa..."
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="characters"
          />
        </View>
      </View>

      {/* Lista de busetas */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#16a34a" />
          <Text className="text-gray-500 mt-4">Cargando busetas...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredBusetas}
          renderItem={renderBuseta}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmpty}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={["#16a34a"]}
              tintColor="#16a34a"
            />
          }
        />
      )}
    </View>
  );
}
