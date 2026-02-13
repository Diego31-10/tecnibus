import { Colors } from "@/lib/constants/colors";
import {
  CreateUserModal,
  EntityCard,
  SearchBar,
  StatsStrip,
  SubScreenHeader,
} from "@/features/admin";
import { haptic } from "@/lib/utils/haptics";
import { useFocusEffect, useRouter } from "expo-router";
import { Mail, Plus, Users } from "lucide-react-native";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StatusBar,
  Text,
  View,
} from "react-native";
import Toast from "@/components/Toast";
import {
  eliminarUsuario,
  obtenerPadres,
  type Profile,
} from "@/lib/services/admin.service";

export default function ListaPadresScreen() {
  const router = useRouter();
  const [padres, setPadres] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: "success" | "error" | "warning" | "info";
  }>({ visible: false, message: "", type: "success" });

  const cargarPadres = useCallback(async () => {
    try {
      const data = await obtenerPadres();
      setPadres(data);
    } catch {
      showToast("Error al cargar representantes", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      cargarPadres();
    }, [cargarPadres])
  );

  const showToast = (
    message: string,
    type: "success" | "error" | "warning"
  ) => {
    setToast({ visible: true, message, type });
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return padres;
    const q = search.toLowerCase();
    return padres.filter(
      (p) =>
        p.nombre.toLowerCase().includes(q) ||
        (p.apellido && p.apellido.toLowerCase().includes(q)) ||
        p.correo.toLowerCase().includes(q)
    );
  }, [padres, search]);

  const confirmarEliminar = (padre: Profile) => {
    haptic.medium();
    Alert.alert(
      "Eliminar Representante",
      `¿Eliminar a ${padre.nombre} ${padre.apellido || ""}? Esta acción no se puede deshacer.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => handleEliminar(padre.id),
        },
      ]
    );
  };

  const handleEliminar = async (userId: string) => {
    setDeletingId(userId);
    const result = await eliminarUsuario(userId);
    if (result.success) {
      setPadres((prev) => prev.filter((p) => p.id !== userId));
      showToast("Representante eliminado correctamente", "success");
    } else {
      showToast(result.error || "Error al eliminar", "error");
    }
    setDeletingId(null);
  };

  const stats = useMemo(
    () => [{ label: "Total", value: padres.length, icon: Users }],
    [padres]
  );

  return (
    <View style={{ flex: 1, backgroundColor: Colors.tecnibus[50] }}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={Colors.tecnibus[700]}
        translucent={false}
      />

      <SubScreenHeader
        title="REPRESENTANTES"
        subtitle={`${padres.length} registrados`}
        icon={Users}
        onBack={() => router.back()}
        rightAction={{ icon: Plus, onPress: () => setShowModal(true) }}
      />

      <StatsStrip stats={stats} />

      <SearchBar
        value={search}
        onChangeText={setSearch}
        placeholder="Buscar representante..."
      />

      {loading ? (
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <ActivityIndicator size="large" color={Colors.tecnibus[600]} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                cargarPadres();
              }}
              colors={[Colors.tecnibus[600]]}
              tintColor={Colors.tecnibus[600]}
            />
          }
          renderItem={({ item }) => (
            <EntityCard
              icon={Users}
              title={`${item.nombre} ${item.apellido || ""}`}
              subtitle={item.correo}
              meta={[{ icon: Mail, text: item.correo }]}
              onDelete={() => confirmarEliminar(item)}
              deleting={deletingId === item.id}
            />
          )}
          ListEmptyComponent={
            <View
              style={{
                alignItems: "center",
                justifyContent: "center",
                paddingVertical: 48,
              }}
            >
              <Users
                size={48}
                color={Colors.tecnibus[300]}
                strokeWidth={1.5}
              />
              <Text
                style={{
                  color: "#6B7280",
                  textAlign: "center",
                  marginTop: 16,
                  fontSize: 15,
                }}
              >
                {search
                  ? "No se encontraron representantes"
                  : "No hay representantes registrados"}
              </Text>
            </View>
          }
        />
      )}

      <CreateUserModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        userType="padre"
        onSuccess={cargarPadres}
        onToast={showToast}
      />

      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast((prev) => ({ ...prev, visible: false }))}
      />
    </View>
  );
}
