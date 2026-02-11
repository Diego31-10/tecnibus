import { Colors } from "@/lib/constants/colors";
import {
  BellOff,
  CheckCircle2,
  MessageCircle,
  User,
} from "lucide-react-native";
import { Image, Text, TouchableOpacity, View } from "react-native";

interface ParentTrackingHeroProps {
  studentName: string;
  busNumber: string;
  driverName: string;
  driverPhotoUrl?: string;
  isOnline?: boolean;
  isAttending?: boolean;
  onChatPress: () => void;
  onNotifyAbsencePress: () => void;
}

export function ParentTrackingHero({
  studentName,
  busNumber,
  driverName,
  driverPhotoUrl,
  isOnline = true,
  isAttending = true,
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
      {/* Header: Student name + driver photo */}
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-1">
          <Text
            className="font-bold font-calsans"
            style={{
              fontSize: 20,
              color: Colors.tecnibus[800],
              marginBottom: 4,
            }}
          >
            {studentName} is on the way
          </Text>
          <Text style={{ fontSize: 13, color: "#6B7280" }}>
            {busNumber} • Driver: {driverName}
          </Text>
        </View>

        {/* Driver photo */}
        <View style={{ position: "relative" }}>
          {driverPhotoUrl ? (
            <Image
              source={{ uri: driverPhotoUrl }}
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                borderWidth: 2,
                borderColor: Colors.tecnibus[200],
              }}
            />
          ) : (
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: Colors.tecnibus[100],
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 2,
                borderColor: Colors.tecnibus[200],
              }}
            >
              <User size={24} color={Colors.tecnibus[600]} strokeWidth={2} />
            </View>
          )}

          {/* Online indicator */}
          {isOnline && (
            <View
              style={{
                position: "absolute",
                bottom: -2,
                right: -2,
                width: 16,
                height: 16,
                borderRadius: 8,
                backgroundColor: "#10B981",
                borderWidth: 2,
                borderColor: "#ffffff",
              }}
            />
          )}
        </View>
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
            Chat Driver
          </Text>
        </TouchableOpacity>

        {/* Notify Absence / Mark Present - Outlined */}
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
            {isAttending ? "Notify Absence" : "Mark Present"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
