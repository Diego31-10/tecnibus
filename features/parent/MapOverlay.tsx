import { Colors } from "@/lib/constants/colors";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface MapOverlayProps {
  title: string;
  subtitle: string;
}

export function MapOverlay({ title, subtitle }: MapOverlayProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        position: "absolute",
        top: insets.top + 16,
        left: 16,
        right: 16,
        zIndex: 10,
      }}
    >
      <View
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.95)",
          borderRadius: 16,
          paddingVertical: 12,
          paddingHorizontal: 20,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 12,
          elevation: 8,
        }}
      >
        <Text
          className="font-bold font-calsans text-center"
          style={{
            fontSize: 18,
            color: Colors.tecnibus[700],
            marginBottom: 2,
          }}
        >
          {title}
        </Text>
        <Text
          className="text-center"
          style={{
            fontSize: 13,
            color: Colors.tecnibus[600],
          }}
        >
          {subtitle}
        </Text>
      </View>
    </View>
  );
}
