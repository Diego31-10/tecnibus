import { Colors } from "@/lib/constants/colors";
import { LinearGradient } from "expo-linear-gradient";
import { LucideIcon, Shield } from "lucide-react-native";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface DashboardHeaderProps {
  title: string;
  subtitle: string;
  gradientColors?: string[];
  icon?: LucideIcon;
  iconBgOpacity?: number;
}

export function DashboardHeader({
  title,
  subtitle,
  gradientColors = [Colors.tecnibus[600], Colors.tecnibus[500], Colors.tecnibus[400]],
  icon: Icon = Shield,
  iconBgOpacity = 0.2,
}: DashboardHeaderProps) {
  const insets = useSafeAreaInsets();
  const paddingTop = Math.max(insets.top + 8, 44);

  return (
    <LinearGradient
      colors={gradientColors as any}
      start={{ x: 0, y: 0 }}
      end={{ x: 0.7, y: 1 }}
      style={{
        paddingTop,
        paddingBottom: 40,
        paddingHorizontal: 24,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
      }}
    >
      {/* Top bar: icon + title */}
      <View className="flex-row items-center" style={{ marginBottom: 20 }}>
        <View
          className="items-center justify-center"
          style={{
            width: 38,
            height: 38,
            borderRadius: 19,
            backgroundColor: `rgba(255,255,255,${iconBgOpacity})`,
            marginRight: 12,
          }}
        >
          <Icon size={18} color="#ffffff" strokeWidth={2.5} />
        </View>
        <Text
          className="text-white font-semibold font-calsans"
          style={{ fontSize: 16 }}
        >
          {title}
        </Text>
      </View>

      {/* Greeting */}
      <Text
        style={{
          fontSize: 15,
          marginBottom: 4,
          color: "rgba(255,255,255,0.8)",
        }}
      >
        Bienvenido de nuevo
      </Text>
      <Text
        className="text-white font-bold font-calsans"
        style={{ fontSize: 28 }}
      >
        {subtitle}
      </Text>
    </LinearGradient>
  );
}
