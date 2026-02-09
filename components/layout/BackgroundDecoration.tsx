import { Colors } from "@/lib/constants/colors";
import { LinearGradient } from "expo-linear-gradient";
import { View } from "react-native";

/**
 * Decorative shapes rendered INLINE between content sections.
 * Uses absolute positioning within a relative container so shapes
 * overflow behind adjacent cards without blocking touches.
 */
export function DecorationTop() {
  return (
    <View style={{ height: 0, overflow: "visible" }} pointerEvents="none">
      {/* Large circle peeking from the right */}
      <View
        style={{
          position: "absolute",
          top: -20,
          right: -50,
          width: 180,
          height: 180,
          borderRadius: 90,
          backgroundColor: Colors.tecnibus[200],
          opacity: 0.45,
        }}
      />
      {/* Small dot left */}
      <View
        style={{
          position: "absolute",
          top: 30,
          left: 28,
          width: 10,
          height: 10,
          borderRadius: 5,
          backgroundColor: Colors.tecnibus[400],
          opacity: 0.35,
        }}
      />
    </View>
  );
}

export function DecorationMid() {
  return (
    <View style={{ height: 0, overflow: "visible" }} pointerEvents="none">
      {/* Gradient blob from left */}
      <LinearGradient
        colors={[Colors.tecnibus[300], "transparent"]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={{
          position: "absolute",
          top: -40,
          left: -30,
          width: 160,
          height: 160,
          borderRadius: 80,
          opacity: 0.6,
        }}
      />
      {/* Small dot right */}
      <View
        style={{
          position: "absolute",
          top: -20,
          right: 35,
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: Colors.tecnibus[400],
          opacity: 0.3,
        }}
      />
    </View>
  );
}

export function DecorationBottom() {
  return (
    <View style={{ height: 0, overflow: "visible" }} pointerEvents="none">
      {/* Circle peeking from bottom-right */}
      <View
        style={{
          position: "absolute",
          top: -40,
          right: -40,
          width: 130,
          height: 130,
          borderRadius: 65,
          backgroundColor: Colors.tecnibus[200],
          opacity: 0.35,
        }}
      />
      {/* Soft gradient wash */}
      <LinearGradient
        colors={["transparent", `${Colors.tecnibus[200]}60`]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={{
          position: "absolute",
          top: -100,
          left: 0,
          right: 0,
          height: 150,
          opacity: 0.5,
        }}
      />
      {/* Small dot left */}
      <View
        style={{
          position: "absolute",
          top: -70,
          left: 40,
          width: 12,
          height: 12,
          borderRadius: 6,
          backgroundColor: Colors.tecnibus[300],
          opacity: 0.4,
        }}
      />
    </View>
  );
}
