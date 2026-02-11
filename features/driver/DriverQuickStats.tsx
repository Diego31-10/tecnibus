import { Text, View } from "react-native";

interface DriverQuickStatsProps {
  pickedUp: number;
  total: number;
  remaining: number;
  estimatedMinutes?: number;
}

export function DriverQuickStats({
  pickedUp,
  total,
  remaining,
  estimatedMinutes,
}: DriverQuickStatsProps) {
  return (
    <View
      className="flex-row justify-around"
      style={{ paddingVertical: 16, paddingHorizontal: 20 }}
    >
      <View className="items-center">
        <Text className="font-bold" style={{ fontSize: 20, color: "#1F2937" }}>
          {pickedUp}/{total}
        </Text>
        <Text
          style={{
            fontSize: 10,
            letterSpacing: 1,
            textTransform: "uppercase",
            color: "#9CA3AF",
            marginTop: 4,
          }}
        >
          RECOGIDOS
        </Text>
      </View>

      <View className="items-center">
        <Text className="font-bold" style={{ fontSize: 20, color: "#1F2937" }}>
          {remaining}
        </Text>
        <Text
          style={{
            fontSize: 10,
            letterSpacing: 1,
            textTransform: "uppercase",
            color: "#9CA3AF",
            marginTop: 4,
          }}
        >
          RESTANTES
        </Text>
      </View>

      <View className="items-center">
        <Text className="font-bold" style={{ fontSize: 20, color: "#1F2937" }}>
          ~{estimatedMinutes ?? "--"}
        </Text>
        <Text
          style={{
            fontSize: 10,
            letterSpacing: 1,
            textTransform: "uppercase",
            color: "#9CA3AF",
            marginTop: 4,
          }}
        >
          MIN TOTAL
        </Text>
      </View>
    </View>
  );
}
