import { Colors } from "@/lib/constants/colors";
import { LinearGradient } from "expo-linear-gradient";
import { Home, MapPin, Settings } from "lucide-react-native";
import { ReactNode } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface BottomNavigationProps {
  activeTab: "home" | "tracking" | "settings";
  onHomePress: () => void;
  onTrackingPress: () => void;
  onSettingsPress: () => void;
  activeColor?: string;
}

const INACTIVE_COLOR = "#9CA3AF";

export function BottomNavigation({
  activeTab,
  onHomePress,
  onTrackingPress,
  onSettingsPress,
  activeColor = Colors.tecnibus[600],
}: BottomNavigationProps) {
  const insets = useSafeAreaInsets();
  const paddingBottom = Math.max(insets.bottom, 8);

  return (
    <View
      style={{
        position: "absolute",
        bottom: 7,
        left: 14,
        right: 14,
        paddingHorizontal: 16,
        paddingBottom,
      }}
    >
      {/* Outer shadow layer */}
      <View
        style={{
          borderRadius: 28,
          shadowColor: Colors.tecnibus[800],
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.15,
          shadowRadius: 20,
          elevation: 14,
        }}
      >
        {/* Glass gradient background */}
        <LinearGradient
          colors={[
            "rgba(235, 248, 255, 0.92)",
            "rgba(244, 250, 253, 0.95)",
            "rgba(255, 255, 255, 0.88)",
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            borderRadius: 28,
            borderWidth: 1,
            borderColor: "rgba(209, 235, 247, 0.6)",
          }}
        >
          {/* Inner highlight (simulates glass refraction) */}
          <View
            style={{
              position: "absolute",
              top: 1,
              left: 20,
              right: 20,
              height: 1,
              backgroundColor: "rgba(255, 255, 255, 0.8)",
              borderRadius: 1,
            }}
          />

          <View
            className="flex-row items-center justify-around"
            style={{ paddingVertical: 8 }}
          >
            <TabItem
              label="Inicio"
              icon={<Home size={21} color={activeTab === "home" ? "#ffffff" : INACTIVE_COLOR} strokeWidth={2} />}
              active={activeTab === "home"}
              onPress={onHomePress}
              activeColor={activeColor}
            />

            <TabItem
              label="Tracking"
              icon={<MapPin size={21} color={activeTab === "tracking" ? "#ffffff" : INACTIVE_COLOR} strokeWidth={2} />}
              active={activeTab === "tracking"}
              onPress={onTrackingPress}
              activeColor={activeColor}
            />

            <TabItem
              label="Ajustes"
              icon={<Settings size={21} color={activeTab === "settings" ? "#ffffff" : INACTIVE_COLOR} strokeWidth={2} />}
              active={activeTab === "settings"}
              onPress={onSettingsPress}
              activeColor={activeColor}
            />
          </View>
        </LinearGradient>
      </View>
    </View>
  );
}

function TabItem({
  label,
  icon,
  active,
  onPress,
  activeColor,
}: {
  label: string;
  icon: ReactNode;
  active: boolean;
  onPress: () => void;
  activeColor: string;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className="items-center"
    >
      <View
        className="items-center justify-center"
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: active ? activeColor : "transparent",
          shadowColor: active ? activeColor : "transparent",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: active ? 0.35 : 0,
          shadowRadius: 6,
          elevation: active ? 4 : 0,
        }}
      >
        {icon}
      </View>
      <Text
        className="font-semibold"
        style={{
          fontSize: 10,
          marginTop: 2,
          color: active ? activeColor : INACTIVE_COLOR,
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}
