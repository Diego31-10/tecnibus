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
import { Bus, Mail, Plus, UserCircle, Users } from "lucide-react-native";
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
  obtenerChoferes,
  type Profile,
} from "@/lib/services/admin.service";

export default function ListaChoferesScreen() {
  const router = useRouter();
  const [choferes, setChoferes] = useState<Profile[]>([]);
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

  const cargarChoferes = useCallback(async () => {
    try {
      const data = await obtenerChoferes();
      setChoferes(data);
    } catch {
      showToast("Error al cargar conductores", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      cargarChoferes();
    }, [cargarChoferes])
  );

  const showToast = (
    message: string,
    type: "success" | "error" | "warning"
  ) => {
    setToast({ visible: true, message, type });
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return choferes;
    const q = search.toLowerCase();
    return choferes.filter(
      (c) =>
        c.nombre.toLowerCase().includes(q) ||
        (c.apellido && c.apellido.toLowerCase().includes(q)) ||
        c.correo.toLowerCase().includes(q)
    );
  }, [choferes, search]);

  const confirmarEliminar = (chofer: Profile) => {
    haptic.medium();
    Alert.alert(
      "Eliminar Conductor",
      `¿Eliminar a ${chofer.nombre} ${chofer.apellido || ""}? Esta acción no se puede deshacer.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => handleEliminar(chofer.id),
        },
      ]
    );
  };

  const handleEliminar = async (userId: string) => {
    setDeletingId(userId);
    const result = await eliminarUsuario(userId);
    if (result.success) {
      setChoferes((prev) => prev.filter((c) => c.id !== userId));
      showToast("Conductor eliminado correctamente", "success");
    } else {
      showToast(result.error || "Error al eliminar", "error");
    }
    setDeletingId(null);
  };

  const stats = useMemo(
    () => [
      { label: "Total", value: choferes.length, icon: Users },
    ],
    [choferes]
  );

  return (
    <View style={{ flex: 1, backgroundColor: Colors.tecnibus[50] }}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={Colors.tecnibus[700]}
        translucent={false}
      />

      <SubScreenHeader
        title="CONDUCTORES"
        subtitle={`${choferes.length} registrados`}
        icon={UserCircle}
        onBack={() => router.back()}
        rightAction={{ icon: Plus, onPress: () => setShowModal(true) }}
      />

      <StatsStrip stats={stats} />

      <SearchBar
        value={search}
        onChangeText={setSearch}
        placeholder="Buscar conductor..."
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
                cargarChoferes();
              }}
              colors={[Colors.tecnibus[600]]}
              tintColor={Colors.tecnibus[600]}
            />
          }
          renderItem={({ item }) => (
            <EntityCard
              icon={UserCircle}
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
              <UserCircle
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
                  ? "No se encontraron conductores"
                  : "No hay conductores registrados"}
              </Text>
            </View>
          }
        />
      )}

      <CreateUserModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        userType="chofer"
        onSuccess={cargarChoferes}
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
