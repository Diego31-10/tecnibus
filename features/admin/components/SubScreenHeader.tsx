import { Colors } from "@/lib/constants/colors";
import { LinearGradient } from "expo-linear-gradient";
import { ArrowLeft, LucideIcon } from "lucide-react-native";
import { Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface SubScreenHeaderProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  onBack: () => void;
  rightAction?: { icon: LucideIcon; onPress: () => void };
}

export function SubScreenHeader({
  title,
  subtitle,
  icon: Icon,
  onBack,
  rightAction,
}: SubScreenHeaderProps) {
  const insets = useSafeAreaInsets();
  const paddingTop = Math.max(insets.top + 8, 44);

  return (
    <LinearGradient
      colors={[
        Colors.tecnibus[700],
        Colors.tecnibus[600],
        Colors.tecnibus[500],
      ]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0.7, y: 1 }}
      style={{
        paddingTop,
        paddingBottom: 20,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <TouchableOpacity
          onPress={onBack}
          style={{
            backgroundColor: "rgba(255,255,255,0.2)",
            padding: 8,
            borderRadius: 12,
          }}
        >
          <ArrowLeft size={22} color="#ffffff" strokeWidth={2.5} />
        </TouchableOpacity>

        <View
          style={{
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
            marginLeft: 12,
          }}
        >
          {Icon && (
            <View
              style={{
                backgroundColor: "rgba(255,255,255,0.2)",
                padding: 8,
                borderRadius: 12,
                marginRight: 10,
              }}
            >
              <Icon size={20} color="#ffffff" strokeWidth={2} />
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text
              style={{
                color: "#ffffff",
                fontSize: 20,
                fontWeight: "700",
              }}
            >
              {title}
            </Text>
            {subtitle && (
              <Text
                style={{
                  color: "rgba(255,255,255,0.8)",
                  fontSize: 13,
                  marginTop: 2,
                }}
              >
                {subtitle}
              </Text>
            )}
          </View>
        </View>

        {rightAction ? (
          <TouchableOpacity
            onPress={rightAction.onPress}
            style={{
              backgroundColor: "rgba(255,255,255,0.2)",
              padding: 8,
              borderRadius: 12,
            }}
          >
            <rightAction.icon
              size={22}
              color="#ffffff"
              strokeWidth={2.5}
            />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 38 }} />
        )}
      </View>
    </LinearGradient>
  );
}
