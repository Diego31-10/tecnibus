import RouteMap from "@/components/RouteMap";
import { Colors } from "@/lib/constants/colors";
import type { Parada } from "@/lib/services/rutas.service";
import type { UbicacionActual } from "@/lib/services/ubicaciones.service";
import { Circle, Maximize2 } from "lucide-react-native";
import { Text, TouchableOpacity, View } from "react-native";

interface MapCardProps {
  paradas: Parada[];
  ubicacionBus: UbicacionActual | null;
  recorridoActivo: boolean;
  polylineCoordinates?: { latitude: number; longitude: number }[];
  ubicacionColegio?: { latitud: number; longitud: number; nombre: string } | null;
  mostrarUbicacionChofer?: boolean;
  ubicacionChofer?: { latitude: number; longitude: number } | null;
  onExpandMap?: () => void;
}

export function MapCard({
  paradas,
  ubicacionBus,
  recorridoActivo,
  polylineCoordinates,
  ubicacionColegio,
  mostrarUbicacionChofer,
  ubicacionChofer,
  onExpandMap,
}: MapCardProps) {
  return (
    <View
      style={{
        backgroundColor: "#ffffff",
        borderRadius: 20,
        marginHorizontal: 16,
        overflow: "hidden",
        height: 220,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
      }}
    >
      {/* Map */}
      <RouteMap
        paradas={paradas}
        ubicacionBus={ubicacionBus}
        recorridoActivo={recorridoActivo}
        polylineCoordinates={polylineCoordinates}
        ubicacionColegio={ubicacionColegio}
        mostrarUbicacionChofer={mostrarUbicacionChofer}
        ubicacionChofer={ubicacionChofer}
        showsUserLocation={false}
      />

      {/* Bottom-right overlay: expand */}
      {onExpandMap && (
        <TouchableOpacity
          onPress={onExpandMap}
          activeOpacity={0.8}
          style={{
            position: "absolute",
            bottom: 12,
            right: 12,
            backgroundColor: Colors.tecnibus[600],
            borderRadius: 999,
            paddingHorizontal: 12,
            paddingVertical: 6,
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <Maximize2 size={12} color="#ffffff" strokeWidth={2.5} />
          <Text
            className="font-semibold"
            style={{ fontSize: 11, color: "#ffffff", marginLeft: 6 }}
          >
            VISTA AMPLIADA
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
