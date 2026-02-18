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
import { Clock, MapPin, Plus } from "lucide-react-native";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StatusBar,
  Text,
  View,
} from "react-native";
import { Ruta, getRutas } from "@/lib/services/rutas.service";

export default function RutasListScreen() {
  const router = useRouter();
  const [search, setSearch] = useState("");

  const { data: rutas = [], isLoading: loading, refetch, isRefetching: refreshing } = useQuery({
    queryKey: ['rutas'],
    queryFn: getRutas,
  });

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const filtered = useMemo(() => {
    if (!search.trim()) return rutas;
    const q = search.toLowerCase();
    return rutas.filter((r) => r.nombre.toLowerCase().includes(q));
  }, [rutas, search]);

  const activas = rutas.filter((r) => r.estado === "activa").length;
  const totalParadas = rutas.reduce(
    (sum, r) => sum + (r.paradas?.length || 0),
    0
  );

  const stats = useMemo(
    () => [
      { label: "Total", value: rutas.length, icon: MapPin },
      { label: "Activas", value: activas },
      { label: "Paradas", value: totalParadas },
    ],
    [rutas.length, activas, totalParadas]
  );

  return (
    <View style={{ flex: 1, backgroundColor: Colors.tecnibus[50] }}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={Colors.tecnibus[700]}
        translucent={false}
      />

      <SubScreenHeader
        title="RUTAS"
        subtitle={`${rutas.length} rutas`}
        icon={MapPin}
        onBack={() => router.back()}
        rightAction={{
          icon: Plus,
          onPress: () => {
            haptic.medium();
            router.push("/admin/rutas/crear");
          },
        }}
      />

      <StatsStrip stats={stats} />

      <SearchBar
        value={search}
        onChangeText={setSearch}
        placeholder="Buscar ruta..."
      />

      {loading ? (
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <ActivityIndicator size="large" color={Colors.tecnibus[600]} />
          <Text style={{ color: "#6B7280", marginTop: 16 }}>
            Cargando rutas...
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
          renderItem={({ item }) => {
            const numParadas = item.paradas?.length || 0;
            return (
              <EntityCard
                icon={MapPin}
                title={item.nombre}
                badge={{
                  text: item.estado === "activa" ? "Activa" : "Inactiva",
                  active: item.estado === "activa",
                }}
                meta={[
                  ...(item.hora_inicio
                    ? [
                        {
                          icon: Clock,
                          text: `${item.hora_inicio} - ${item.hora_fin || ""}`,
                        },
                      ]
                    : []),
                  {
                    icon: MapPin,
                    text: `${numParadas} ${numParadas === 1 ? "parada" : "paradas"}`,
                  },
                ]}
                onPress={() => {
                  haptic.light();
                  router.push(`/admin/rutas/${item.id}` as never);
                }}
              />
            );
          }}
          ListEmptyComponent={
            <View
              style={{
                alignItems: "center",
                justifyContent: "center",
                paddingVertical: 48,
              }}
            >
              <MapPin
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
                  ? "No se encontraron rutas"
                  : "No hay rutas registradas"}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}
