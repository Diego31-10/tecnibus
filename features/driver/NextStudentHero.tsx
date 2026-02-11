import { Colors } from "@/lib/constants/colors";
import {
  MapPin,
  Navigation,
  Phone,
  Wifi,
  X,
} from "lucide-react-native";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";

interface NextStudentHeroProps {
  studentName: string;
  address: string;
  parentName?: string;
  parentPhone?: string;
  estimatedMinutes?: number;
  isApproaching?: boolean;
  onNavigate: () => void;
  onCallParent?: () => void;
  onMarkAbsent: () => void;
  isProcessing?: boolean;
}

export function NextStudentHero({
  studentName,
  address,
  parentName,
  parentPhone,
  estimatedMinutes,
  isApproaching = false,
  onNavigate,
  onCallParent,
  onMarkAbsent,
  isProcessing = false,
}: NextStudentHeroProps) {
  return (
    <View
      style={{
        backgroundColor: "#ffffff",
        borderRadius: 20,
        padding: 20,
        marginHorizontal: 16,
        marginTop: -20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
        elevation: 8,
      }}
    >
      {/* Top row: label + ETA badge */}
      <View className="flex-row items-start justify-between">
        <Text
          className="font-bold"
          style={{
            fontSize: 11,
            color: Colors.tecnibus[500],
            letterSpacing: 1,
            textTransform: "uppercase",
          }}
        >
          SIGUIENTE PARADA
        </Text>
        {estimatedMinutes != null && (
          <View
            style={{
              backgroundColor: Colors.tecnibus[600],
              borderRadius: 14,
              width: 52,
              height: 52,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text
              className="font-bold"
              style={{ fontSize: 18, color: "#ffffff", lineHeight: 20 }}
            >
              {estimatedMinutes}
            </Text>
            <Text
              style={{
                fontSize: 9,
                color: "rgba(255,255,255,0.8)",
                letterSpacing: 0.5,
              }}
            >
              MIN
            </Text>
          </View>
        )}
      </View>

      {/* Student name */}
      <Text
        className="font-bold"
        style={{ fontSize: 22, color: "#1F2937", marginTop: 4 }}
      >
        {studentName}
      </Text>

      {/* Auto-attendance indicator */}
      <View className="flex-row items-center" style={{ marginTop: 8 }}>
        <MapPin size={13} color={Colors.tecnibus[600]} strokeWidth={2.5} />
        <Text
          className="font-semibold"
          style={{
            fontSize: 11,
            color: Colors.tecnibus[600],
            letterSpacing: 0.5,
            marginLeft: 6,
          }}
        >
          ASISTENCIA AUTOMATICA ACTIVA
        </Text>
      </View>

      {/* Address */}
      <View className="flex-row items-center" style={{ marginTop: 8 }}>
        <MapPin size={14} color="#9CA3AF" strokeWidth={2} />
        <Text style={{ fontSize: 14, color: "#6B7280", marginLeft: 6, flex: 1 }}>
          {address}
        </Text>
      </View>

      {/* Parent row + navigate button */}
      <View
        className="flex-row items-center justify-between"
        style={{ marginTop: 10 }}
      >
        <TouchableOpacity
          className="flex-row items-center"
          onPress={onCallParent}
          activeOpacity={parentPhone ? 0.7 : 1}
          disabled={!parentPhone}
        >
          <Phone size={14} color="#9CA3AF" strokeWidth={2} />
          <Text style={{ fontSize: 14, color: "#6B7280", marginLeft: 6 }}>
            {parentName || "Padre/Madre"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onNavigate}
          activeOpacity={0.8}
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: Colors.tecnibus[600],
            alignItems: "center",
            justifyContent: "center",
            shadowColor: Colors.tecnibus[600],
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.35,
            shadowRadius: 6,
            elevation: 4,
          }}
        >
          <Navigation size={20} color="#ffffff" strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      {/* Action buttons */}
      <View
        className="flex-row items-center justify-between"
        style={{ marginTop: 16 }}
      >
        <TouchableOpacity
          onPress={onMarkAbsent}
          disabled={isProcessing}
          activeOpacity={0.8}
          style={{
            backgroundColor: "#F97316",
            borderRadius: 25,
            paddingVertical: 12,
            paddingHorizontal: 20,
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          {isProcessing ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <>
              <X size={16} color="#ffffff" strokeWidth={2.5} />
              <Text
                className="font-bold"
                style={{ fontSize: 13, color: "#ffffff", marginLeft: 6 }}
              >
                MARCAR AUSENCIA
              </Text>
            </>
          )}
        </TouchableOpacity>

        <View
          style={{
            backgroundColor: "#F3F4F6",
            borderRadius: 25,
            paddingVertical: 12,
            paddingHorizontal: 16,
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <Wifi size={14} color="#6B7280" strokeWidth={2} />
          <Text
            className="font-semibold"
            style={{ fontSize: 12, color: "#6B7280", marginLeft: 6 }}
          >
            {isApproaching ? "LLEGANDO.." : "EN CAMINO"}
          </Text>
        </View>
      </View>

      {/* Disclaimer */}
      <Text
        style={{
          fontSize: 11,
          color: "#9CA3AF",
          textAlign: "center",
          marginTop: 12,
        }}
      >
        La asistencia se marcara automaticamente al llegar al perimetro
      </Text>
    </View>
  );
}
