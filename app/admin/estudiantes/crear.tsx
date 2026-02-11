import { Colors } from "@/lib/constants/colors";
import { haptic } from "@/lib/utils/haptics";
import { createShadow } from "@/lib/utils/shadows";
import { useRouter } from "expo-router";
import {
    ArrowLeft,
    Check,
    MapPin,
    Search,
    User,
    X
} from "lucide-react-native";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Modal,
    ScrollView,
    StatusBar,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AnimatedCard } from "../../../components";
import Toast from "../../../components/Toast";
import {
    createEstudiante,
    getPadresParaAsignar,
    getParadasDisponibles,
} from "../../../lib/services/estudiantes.service";

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

export default function CrearEstudianteScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const paddingTop = Math.max(insets.top + 8, 48);
  const shadow = createShadow("lg");

  // Form state
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [padreSeleccionado, setPadreSeleccionado] = useState<Padre | null>(
    null,
  );
  const [paradaSeleccionada, setParadaSeleccionada] = useState<Parada | null>(
    null,
  );

  // Lists
  const [padres, setPadres] = useState<Padre[]>([]);
  const [paradas, setParadas] = useState<Parada[]>([]);

  // UI State
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [showPadresModal, setShowPadresModal] = useState(false);
  const [showParadasModal, setShowParadasModal] = useState(false);
  const [searchPadre, setSearchPadre] = useState("");
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: "success" | "error" | "warning" | "info";
  }>({
    visible: false,
    message: "",
    type: "success",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoadingData(true);
    const [padresData, paradasData] = await Promise.all([
      getPadresParaAsignar(),
      getParadasDisponibles(),
    ]);
    setPadres(padresData);
    setParadas(paradasData);
    setLoadingData(false);
  };

  const filteredPadres = padres.filter((padre) =>
    padre.nombreCompleto.toLowerCase().includes(searchPadre.toLowerCase()),
  );

  const handleSelectPadre = (padre: Padre) => {
    haptic.light();
    setPadreSeleccionado(padre);
    setShowPadresModal(false);
    setSearchPadre("");
  };

  const handleSelectParada = (parada: Parada) => {
    haptic.light();
    setParadaSeleccionada(parada);
    setShowParadasModal(false);
  };

  const handleSubmit = async () => {
    // Validaciones
    if (!nombre.trim()) {
      setToast({
        visible: true,
        message: "Ingresa el nombre",
        type: "warning",
      });
      return;
    }

    if (!apellido.trim()) {
      setToast({
        visible: true,
        message: "Ingresa el apellido",
        type: "warning",
      });
      return;
    }

    if (!padreSeleccionado) {
      setToast({
        visible: true,
        message: "Debes seleccionar un padre",
        type: "warning",
      });
      return;
    }

    haptic.medium();
    setLoading(true);

    const result = await createEstudiante({
      nombre: nombre.trim(),
      apellido: apellido.trim(),
      id_padre: padreSeleccionado.id,
      id_parada: paradaSeleccionada?.id || null,
    });

    setLoading(false);

    if (result) {
      setToast({
        visible: true,
        message: "Estudiante creado correctamente",
        type: "success",
      });
      setTimeout(() => router.back(), 1500);
    } else {
      setToast({
        visible: true,
        message: "No se pudo crear el estudiante",
        type: "error",
      });
    }
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
      <StatusBar
        barStyle="light-content"
        backgroundColor={Colors.tecnibus[700]}
        translucent={false}
      />

      {/* Header */}
      <View
        className="bg-estudiante-700 pb-6 px-6 rounded-b-3xl"
        style={[{ paddingTop }, shadow]}
      >
        <View className="flex-row items-center">
          <TouchableOpacity
            className="bg-estudiante-600 p-2 rounded-xl mr-4"
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color="#ffffff" strokeWidth={2.5} />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-white text-2xl font-bold">
              Nuevo Estudiante
            </Text>
            <Text className="text-white text-xl mt-1">Complete los datos</Text>
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
                <User size={18} className="text-padre-500" strokeWidth={2} />
                <Text className="text-base text-gray-800 ml-2">
                  {padreSeleccionado.nombreCompleto}
                </Text>
              </View>
            ) : (
              <Text className="text-base text-gray-400">Seleccionar padre</Text>
            )}
            <Search size={18} color="#9ca3af" strokeWidth={2} />
          </TouchableOpacity>
          {padres.length === 0 && (
            <Text className="text-xs text-amber-600 mt-2">
              ⚠️ No hay padres registrados. Crea uno primero.
            </Text>
          )}
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
                    {paradaSeleccionada.nombre || "Sin nombre"}
                  </Text>
                </View>
                {paradaSeleccionada.ruta && (
                  <Text className="text-xs text-gray-500 ml-6 mt-1">
                    Ruta: {paradaSeleccionada.ruta.nombre}
                  </Text>
                )}
              </View>
            ) : (
              <Text className="text-base text-gray-400">
                Sin parada asignada
              </Text>
            )}
            {paradaSeleccionada && (
              <TouchableOpacity onPress={() => setParadaSeleccionada(null)}>
                <X size={18} color="#9ca3af" strokeWidth={2} />
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        </AnimatedCard>

        {/* Botón Guardar */}
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={loading}
          className={`bg-estudiante-600 rounded-xl py-4 mb-8 mt-4 ${
            loading ? "opacity-60" : ""
          }`}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <View className="flex-row items-center justify-center">
              <Check size={20} color="#ffffff" strokeWidth={2.5} />
              <Text className="text-white text-lg font-bold ml-2">
                Crear Estudiante
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
          <View className="bg-white rounded-t-3xl" style={{ maxHeight: "80%" }}>
            {/* Header Modal */}
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

              {/* Búsqueda */}
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

            {/* Lista de Padres */}
            <FlatList
              data={filteredPadres}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => handleSelectPadre(item)}
                  className="px-6 py-4 border-b border-gray-100 flex-row items-center"
                >
                  <View className="bg-padre-100 p-2 rounded-full mr-3">
                    <User
                      size={20}
                      className="text-padre-500"
                      strokeWidth={2}
                    />
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
                  <Text className="text-gray-500">
                    No se encontraron padres
                  </Text>
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
          <View className="bg-white rounded-t-3xl" style={{ maxHeight: "70%" }}>
            {/* Header Modal */}
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

            {/* Lista de Paradas */}
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
                        {item.nombre || "Sin nombre"}
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
                  <Text className="text-gray-500">
                    No hay paradas disponibles
                  </Text>
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
