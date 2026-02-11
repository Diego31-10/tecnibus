import { Colors } from "@/lib/constants/colors";
import { CheckCircle2, Clock } from "lucide-react-native";
import { Text, View } from "react-native";

interface RecorridoStatusBadgeProps {
  isActive: boolean;
}

export function RecorridoStatusBadge({ isActive }: RecorridoStatusBadgeProps) {
  return (
    <View
      style={{
        marginHorizontal: 16,
        marginTop: 10,
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        borderRadius: 12,
        paddingVertical: 10,
        paddingHorizontal: 14,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
      }}
    >
      {isActive ? (
        <>
          <View
            style={{
              backgroundColor: Colors.tecnibus[100],
              borderRadius: 999,
              padding: 5,
              marginRight: 8,
            }}
          >
            <CheckCircle2 size={16} color={Colors.tecnibus[600]} strokeWidth={2.5} />
          </View>
          <Text
            className="font-bold"
            style={{
              fontSize: 13,
              color: Colors.tecnibus[700],
              letterSpacing: 0.2,
            }}
          >
            En Camino
          </Text>
        </>
      ) : (
        <>
          <View
            style={{
              backgroundColor: "#F3F4F6",
              borderRadius: 999,
              padding: 5,
              marginRight: 8,
            }}
          >
            <Clock size={16} color="#6B7280" strokeWidth={2.5} />
          </View>
          <Text
            className="font-semibold"
            style={{
              fontSize: 13,
              color: "#6B7280",
              letterSpacing: 0.2,
            }}
          >
            Recorrido No Iniciado
          </Text>
        </>
      )}
    </View>
  );
}
