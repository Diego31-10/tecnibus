import RouteMap from "@/components/RouteMap";
import type { Parada } from "@/lib/services/rutas.service";
import type { UbicacionActual } from "@/lib/services/ubicaciones.service";
import { View } from "react-native";

interface MapCardProps {
  paradas: Parada[];
  ubicacionBus: UbicacionActual | null;
  recorridoActivo: boolean;
  polylineCoordinates?: { latitude: number; longitude: number }[];
  ubicacionColegio?: {
    latitud: number;
    longitud: number;
    nombre: string;
  } | null;
  mostrarUbicacionChofer?: boolean;
  ubicacionChofer?: { latitude: number; longitude: number } | null;
}

export function MapCard({
  paradas,
  ubicacionBus,
  recorridoActivo,
  polylineCoordinates,
  ubicacionColegio,
  mostrarUbicacionChofer,
  ubicacionChofer,
}: MapCardProps) {
  return (
    <View
      style={{
        backgroundColor: "#ffffff",
        borderRadius: 20,
        marginHorizontal: 16,
        overflow: "hidden",
        height: 250,
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
    </View>
  );
}
