import { Text, TouchableOpacity, View } from "react-native";
import { LucideIcon } from "lucide-react-native";

interface StatCardProps {
  icon: LucideIcon;
  iconColor: string;
  iconBgColor: string;
  value: number | string;
  label: string;
  onPress: () => void;
}

export function StatCard({
  icon: Icon,
  iconColor,
  iconBgColor,
  value,
  label,
  onPress,
}: StatCardProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.65}
      className="flex-1"
      style={{
        backgroundColor: "#ffffff",
        borderRadius: 16,
        padding: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
      }}
    >
      <View
        className="items-center justify-center"
        style={{
          width: 42,
          height: 42,
          borderRadius: 13,
          backgroundColor: iconBgColor,
          marginBottom: 12,
        }}
      >
        <Icon size={20} color={iconColor} strokeWidth={2} />
      </View>
      <Text className="font-bold font-calsans" style={{ fontSize: 26, color: "#111827", marginBottom: 2 }}>
        {value}
      </Text>
      <Text className="font-semibold" style={{ fontSize: 10, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: 1.2 }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}
