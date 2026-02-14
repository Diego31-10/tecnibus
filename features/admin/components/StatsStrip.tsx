import { Colors } from "@/lib/constants/colors";
import { LucideIcon } from "lucide-react-native";
import { ScrollView, Text, View } from "react-native";

interface StatsStripProps {
  stats: { label: string; value: number | string; icon?: LucideIcon }[];
}

export function StatsStrip({ stats }: StatsStripProps) {
  return (
    <View style={{ height: 48 }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingVertical: 8,
          gap: 8,
        }}
      >
      {stats.map((stat, index) => (
        <View
          key={index}
          style={{
            backgroundColor: Colors.tecnibus[50],
            borderRadius: 12,
            paddingHorizontal: 14,
            paddingVertical: 8,
            flexDirection: "row",
            alignItems: "center",
            borderWidth: 1,
            borderColor: Colors.tecnibus[200],
          }}
        >
          {stat.icon && (
            <stat.icon
              size={14}
              color={Colors.tecnibus[600]}
              strokeWidth={2}
              style={{ marginRight: 6 }}
            />
          )}
          <Text
            style={{
              fontSize: 14,
              fontWeight: "700",
              color: Colors.tecnibus[700],
              marginRight: 4,
            }}
          >
            {stat.value}
          </Text>
          <Text
            style={{
              fontSize: 12,
              color: Colors.tecnibus[800],
            }}
          >
            {stat.label}
          </Text>
        </View>
      ))}
      </ScrollView>
    </View>
  );
}
