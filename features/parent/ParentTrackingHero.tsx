import { Colors } from "@/lib/constants/colors";
import { BellOff, CheckCircle2, MessageCircle } from "lucide-react-native";
import { Text, TouchableOpacity, View } from "react-native";

interface ParentTrackingHeroProps {
  studentName: string;
  driverName: string;
  isOnline?: boolean;
  isAttending?: boolean;
  isRecogido?: boolean;
  onChatPress: () => void;
  onNotifyAbsencePress: () => void;
}

export function ParentTrackingHero({
  studentName,
  driverName,
  isOnline = false,
  isAttending = true,
  isRecogido = false,
  onChatPress,
  onNotifyAbsencePress,
}: ParentTrackingHeroProps) {
  return (
    <View
      style={{
        backgroundColor: "#ffffff",
        borderRadius: 20,
        padding: 20,
        marginHorizontal: 16,
        marginTop: 8,
        marginBottom: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
        elevation: 8,
      }}
    >
      {/* Header: Student name + ruta + indicador online */}
      <View className="mb-4">
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
          <Text
            className="font-bold font-calsans"
            style={{
              fontSize: 20,
              color: Colors.tecnibus[800],
              flex: 1,
            }}
          >
            {studentName}
          </Text>
          {/* Indicador online */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: isOnline ? "#22C55E" : "#D1D5DB",
              }}
            />
            <Text style={{ fontSize: 11, color: isOnline ? "#16A34A" : "#9CA3AF" }}>
              {isOnline ? "En camino" : "Inactivo"}
            </Text>
          </View>
        </View>
        <Text style={{ fontSize: 13, color: "#6B7280" }}>
          Conductor: {driverName}
        </Text>
      </View>

      {/* Action buttons */}
      <View className="flex-row" style={{ gap: 12 }}>
        {/* Chat Driver - Filled */}
        <TouchableOpacity
          onPress={onChatPress}
          activeOpacity={0.8}
          style={{
            flex: 1,
            backgroundColor: Colors.tecnibus[500],
            borderRadius: 12,
            paddingVertical: 14,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            shadowColor: Colors.tecnibus[500],
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 6,
            elevation: 4,
          }}
        >
          <MessageCircle size={18} color="#ffffff" strokeWidth={2.5} />
          <Text
            className="font-semibold ml-2"
            style={{ fontSize: 14, color: "#ffffff" }}
          >
            Chat Chofer
          </Text>
        </TouchableOpacity>

        {/* Notify Absence / Mark Present - oculto cuando ya fue recogido */}
        {!isRecogido && (
          <TouchableOpacity
            onPress={onNotifyAbsencePress}
            activeOpacity={0.8}
            style={{
              flex: 1,
              backgroundColor: isAttending ? "#ffffff" : Colors.tecnibus[50],
              borderRadius: 12,
              paddingVertical: 14,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1.5,
              borderColor: isAttending ? "#E5E7EB" : Colors.tecnibus[300],
            }}
          >
            {isAttending ? (
              <BellOff size={18} color="#6B7280" strokeWidth={2.5} />
            ) : (
              <CheckCircle2
                size={18}
                color={Colors.tecnibus[600]}
                strokeWidth={2.5}
              />
            )}
            <Text
              className="font-semibold ml-2"
              style={{
                fontSize: 14,
                color: isAttending ? "#374151" : Colors.tecnibus[700],
              }}
            >
              {isAttending ? "Marcar falta" : "Marcar presente"}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
