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
  rightBadge?: { text: string; bgColor: string; textColor: string } | null;
}

export function DashboardHeader({
  title,
  subtitle,
  gradientColors = [
    Colors.tecnibus[600],
    Colors.tecnibus[500],
    Colors.tecnibus[400],
  ],
  icon: Icon = Shield,
  iconBgOpacity = 0.2,
  rightBadge,
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
      {/* Top bar: icon + title + optional badge */}
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
        {rightBadge && (
          <View style={{ flex: 1, alignItems: "flex-end" }}>
            <View
              style={{
                backgroundColor: rightBadge.bgColor,
                borderRadius: 999,
                paddingHorizontal: 12,
                paddingVertical: 6,
              }}
            >
              <Text
                className="font-bold"
                style={{
                  fontSize: 11,
                  color: rightBadge.textColor,
                  letterSpacing: 0.5,
                }}
              >
                {rightBadge.text}
              </Text>
            </View>
          </View>
        )}
      </View>

      <Text
        className="text-white font-bold font-calsans"
        style={{ fontSize: 28 }}
      >
        {subtitle}
      </Text>
    </LinearGradient>
  );
}
