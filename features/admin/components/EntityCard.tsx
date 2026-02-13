import { Colors } from "@/lib/constants/colors";
import { LucideIcon, Trash2 } from "lucide-react-native";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";

interface EntityCardProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  meta?: { icon: LucideIcon; text: string }[];
  badge?: { text: string; active: boolean };
  onPress?: () => void;
  onDelete?: () => void;
  deleting?: boolean;
}

export function EntityCard({
  icon: Icon,
  title,
  subtitle,
  meta,
  badge,
  onPress,
  onDelete,
  deleting,
}: EntityCardProps) {
  return (
    <TouchableOpacity
      activeOpacity={onPress ? 0.7 : 1}
      onPress={onPress}
      style={{
        backgroundColor: "#ffffff",
        borderRadius: 16,
        padding: 16,
        marginBottom: 10,
        flexDirection: "row",
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 3,
        elevation: 2,
      }}
    >
      {/* Icon */}
      <View
        style={{
          backgroundColor: Colors.tecnibus[100],
          padding: 12,
          borderRadius: 14,
        }}
      >
        <Icon size={24} color={Colors.tecnibus[600]} strokeWidth={2} />
      </View>

      {/* Content */}
      <View style={{ flex: 1, marginLeft: 14 }}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Text
            style={{
              fontSize: 15,
              fontWeight: "700",
              color: "#1F2937",
              flex: 1,
            }}
            numberOfLines={1}
          >
            {title}
          </Text>
          {badge && (
            <View
              style={{
                backgroundColor: badge.active ? "#DCFCE7" : "#FEF2F2",
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderRadius: 8,
                marginLeft: 8,
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "600",
                  color: badge.active ? "#16A34A" : "#DC2626",
                }}
              >
                {badge.text}
              </Text>
            </View>
          )}
        </View>

        {subtitle && (
          <Text
            style={{ fontSize: 13, color: "#6B7280", marginTop: 2 }}
            numberOfLines={1}
          >
            {subtitle}
          </Text>
        )}

        {meta && meta.length > 0 && (
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              marginTop: 6,
              gap: 10,
            }}
          >
            {meta.map((item, index) => (
              <View
                key={index}
                style={{ flexDirection: "row", alignItems: "center" }}
              >
                <item.icon size={13} color="#9CA3AF" strokeWidth={2} />
                <Text
                  style={{
                    fontSize: 12,
                    color: "#9CA3AF",
                    marginLeft: 4,
                  }}
                >
                  {item.text}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Delete button */}
      {onDelete && (
        <TouchableOpacity
          onPress={onDelete}
          disabled={deleting}
          style={{
            backgroundColor: "#FEF2F2",
            padding: 8,
            borderRadius: 10,
            marginLeft: 8,
          }}
        >
          {deleting ? (
            <ActivityIndicator size="small" color="#DC2626" />
          ) : (
            <Trash2 size={18} color="#DC2626" strokeWidth={2.5} />
          )}
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}
