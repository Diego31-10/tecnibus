import { Colors } from "@/lib/constants/colors";
import { Clock } from "lucide-react-native";
import { Text, View } from "react-native";

interface EstimatedArrivalBadgeProps {
  minutes: number | null;
  onSchedule?: boolean;
}

export function EstimatedArrivalBadge({
  minutes,
  onSchedule = true,
}: EstimatedArrivalBadgeProps) {
  return (
    <View
      style={{
        marginLeft: 16,
        marginTop: 8,
        alignSelf: "flex-start",
      }}
    >
      <View
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.95)",
          borderRadius: 12,
          paddingVertical: 10,
          paddingHorizontal: 14,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 4,
        }}
      >
        {/* Time */}
        <View className="flex-row items-center">
          <Clock size={16} color={Colors.tecnibus[600]} strokeWidth={2.5} />
          <Text
            className="font-bold font-calsans ml-2"
            style={{ fontSize: 20, color: Colors.tecnibus[800] }}
          >
            {minutes !== null ? `~${minutes}` : "--"}
          </Text>
          <Text
            className="font-semibold ml-1"
            style={{ fontSize: 12, color: Colors.tecnibus[600] }}
          >
            min
          </Text>
        </View>
        <Text
          style={{ fontSize: 10, color: "#9CA3AF", marginTop: 2 }}
        >
          a tu parada
        </Text>
      </View>
    </View>
  );
}
