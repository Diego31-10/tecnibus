import { ReactNode } from "react";
import { Text, View } from "react-native";

interface SectionProps {
  title: string;
  children: ReactNode;
  className?: string;
}

export function Section({ title, children, className = "" }: SectionProps) {
  return (
    <View style={{ marginBottom: 24 }}>
      <Text
        className="font-bold font-calsans"
        style={{ fontSize: 18, color: "#111827", marginBottom: 16, paddingHorizontal: 20 }}
      >
        {title}
      </Text>
      {children}
    </View>
  );
}
