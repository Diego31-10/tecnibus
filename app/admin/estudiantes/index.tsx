import { Colors } from "@/lib/constants/colors";
import {
  EntityCard,
  SearchBar,
  StatsStrip,
  SubScreenHeader,
} from "@/features/admin";
import { haptic } from "@/lib/utils/haptics";
import { useQuery } from "@tanstack/react-query";
import { useFocusEffect, useRouter } from "expo-router";
import {
  GraduationCap,
  MapPin,
  Plus,
  User,
  UserX,
} from "lucide-react-native";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StatusBar,
  Text,
  View,
} from "react-native";
import {
  Estudiante,
  getEstudiantes,
} from "@/lib/services/estudiantes.service";

export default function EstudiantesListScreen() {
  const router = useRouter();
  const [search, setSearch] = useState("");

  const { data: estudiantes = [], isLoading: loading, refetch, isRefetching: refreshing } = useQuery({
    queryKey: ['estudiantes'],
    queryFn: getEstudiantes,
  });

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const filtered = useMemo(() => {
    if (!search.trim()) return estudiantes;
    const q = search.toLowerCase();
    return estudiantes.filter(
      (est) =>
        est.nombre.toLowerCase().includes(q) ||
        est.apellido.toLowerCase().includes(q) ||
        est.padre?.nombre.toLowerCase().includes(q) ||
        est.padre?.apellido.toLowerCase().includes(q)
    );
  }, [estudiantes, search]);

  const conParada = estudiantes.filter((e) => e.parada).length;
  const sinParada = estudiantes.length - conParada;

  const stats = useMemo(
    () => [
      { label: "Total", value: estudiantes.length, icon: GraduationCap },
      { label: "Con Parada", value: conParada, icon: MapPin },
      { label: "Sin Parada", value: sinParada, icon: UserX },
    ],
    [estudiantes.length, conParada, sinParada]
  );

  return (
    <View style={{ flex: 1, backgroundColor: Colors.tecnibus[50] }}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={Colors.tecnibus[700]}
        translucent={false}
      />

      <SubScreenHeader
        title="ESTUDIANTES"
        subtitle={`${estudiantes.length} registrados`}
        icon={GraduationCap}
        onBack={() => router.back()}
        rightAction={{
          icon: Plus,
          onPress: () => {
            haptic.medium();
            router.push("/admin/estudiantes/crear");
          },
        }}
      />

      <StatsStrip stats={stats} />

      <SearchBar
        value={search}
        onChangeText={setSearch}
        placeholder="Buscar estudiante..."
      />

      {loading ? (
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <ActivityIndicator size="large" color={Colors.tecnibus[600]} />
          <Text style={{ color: "#6B7280", marginTop: 16 }}>
            Cargando estudiantes...
          </Text>
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
              onRefresh={() => refetch()}
              colors={[Colors.tecnibus[600]]}
              tintColor={Colors.tecnibus[600]}
            />
          }
          renderItem={({ item }) => (
            <EntityCard
              icon={GraduationCap}
              title={`${item.nombre} ${item.apellido}`}
              meta={[
                {
                  icon: User,
                  text: item.padre
                    ? `${item.padre.nombre} ${item.padre.apellido}`
                    : "Sin padre asignado",
                },
                {
                  icon: MapPin,
                  text: item.parada
                    ? `${item.parada.nombre || "Parada"}${item.parada.ruta ? ` - ${item.parada.ruta.nombre}` : ""}`
                    : "Sin parada asignada",
                },
              ]}
              onPress={() => {
                haptic.light();
                router.push(`/admin/estudiantes/${item.id}` as never);
              }}
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
              <GraduationCap
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
                  ? "No se encontraron estudiantes"
                  : "No hay estudiantes registrados"}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}
