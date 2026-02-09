import { Colors } from "@/lib/constants/colors";
import { LinearGradient } from "expo-linear-gradient";
import { Shield } from "lucide-react-native";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface DashboardHeaderProps {
  title: string;
  subtitle: string;
}

export function DashboardHeader({ title, subtitle }: DashboardHeaderProps) {
  const insets = useSafeAreaInsets();
  const paddingTop = Math.max(insets.top + 12, 52);

  return (
    <LinearGradient
      colors={[
        Colors.tecnibus[600],
        Colors.tecnibus[500],
        Colors.tecnibus[400],
      ]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0.7, y: 1 }}
      style={{
        paddingTop,
        paddingBottom: 60,
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
            backgroundColor: "rgba(255,255,255,0.2)",
            marginRight: 12,
          }}
        >
          <Shield size={18} color="#ffffff" strokeWidth={2.5} />
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
