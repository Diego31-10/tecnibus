import { ActionCard } from "@/components/ui/ActionCard";
import { AlertTriangle, BellOff, History, MessageCircle } from "lucide-react-native";
import { View } from "react-native";

interface ParentQuickActionsProps {
  onChatDriverPress: () => void;
  onNotifyAbsencePress: () => void;
  onViewHistoryPress: () => void;
  onEmergencyPress: () => void;
}

export function ParentQuickActions({
  onChatDriverPress,
  onNotifyAbsencePress,
  onViewHistoryPress,
  onEmergencyPress,
}: ParentQuickActionsProps) {
  return (
    <View
      style={{
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 14,
      }}
    >
      {/* Chat Chofer - Azul filled */}
      <View style={{ width: "48%" }}>
        <ActionCard
          icon={MessageCircle}
          iconColor="#ffffff"
          iconBgColor="rgba(255,255,255,0.2)"
          title="Chat Chofer"
          description="Contactar al conductor"
          onPress={onChatDriverPress}
          variant="filled"
          filledBgColor="#3B82F6"
        />
      </View>

      {/* Notificar Ausencia - Naranja */}
      <View style={{ width: "48%" }}>
        <ActionCard
          icon={BellOff}
          iconColor="#F97316"
          iconBgColor="#FFF7ED"
          title="Avisar Ausencia"
          description="Notificar que no asistirá"
          onPress={onNotifyAbsencePress}
        />
      </View>

      {/* Historial - Gris */}
      <View style={{ width: "48%" }}>
        <ActionCard
          icon={History}
          iconColor="#6B7280"
          iconBgColor="#F3F4F6"
          title="Historial"
          description="Ver recorridos anteriores"
          onPress={onViewHistoryPress}
        />
      </View>

      {/* Emergencia - Rojo filled con badge */}
      <View style={{ width: "48%" }}>
        <ActionCard
          icon={AlertTriangle}
          iconColor="#ffffff"
          iconBgColor="rgba(255,255,255,0.2)"
          title="Emergencia"
          description="Asistencia inmediata"
          onPress={onEmergencyPress}
          variant="filled"
          filledBgColor="#EF4444"
          badge="SOS"
        />
      </View>
    </View>
  );
}
