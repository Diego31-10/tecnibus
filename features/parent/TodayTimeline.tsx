import { Colors } from "@/lib/constants/colors";
import { CheckCircle2, Circle, Clock, MapPin } from "lucide-react-native";
import { ScrollView, Text, View } from "react-native";

interface TimelineEvent {
  id: string;
  title: string;
  subtitle: string;
  time?: string;
  status: "completed" | "active" | "upcoming";
  icon: "board" | "departure" | "stop";
}

interface TodayTimelineProps {
  events: TimelineEvent[];
  isLive?: boolean;
}

export function TodayTimeline({ events, isLive = false }: TodayTimelineProps) {
  const getIconComponent = (iconType: TimelineEvent["icon"], status: TimelineEvent["status"]) => {
    const iconColor = status === "active" ? Colors.sky[600] : status === "completed" ? "#9CA3AF" : Colors.sky[600];
    const iconSize = 20;

    switch (iconType) {
      case "board":
        return <CheckCircle2 size={iconSize} color={iconColor} strokeWidth={2.5} />;
      case "departure":
        return <CheckCircle2 size={iconSize} color={iconColor} strokeWidth={2.5} />;
      case "stop":
        return <MapPin size={iconSize} color={iconColor} strokeWidth={2.5} />;
      default:
        return <Circle size={iconSize} color={iconColor} strokeWidth={2.5} />;
    }
  };

  return (
    <View
      style={{
        backgroundColor: "#ffffff",
        borderRadius: 20,
        padding: 20,
        marginHorizontal: 16,
        marginBottom: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
        elevation: 4,
      }}
    >
      {/* Header */}
      <View className="flex-row items-center justify-between mb-5">
        <Text
          className="font-bold font-calsans"
          style={{ fontSize: 18, color: Colors.tecnibus[800] }}
        >
          Today's Timeline
        </Text>
        {isLive && (
          <View
            style={{
              backgroundColor: Colors.sky[100],
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 8,
            }}
          >
            <Text
              className="font-bold"
              style={{
                fontSize: 11,
                color: Colors.sky[700],
                letterSpacing: 0.5,
              }}
            >
              LIVE
            </Text>
          </View>
        )}
      </View>

      {/* Timeline */}
      <View>
        {events.map((event, index) => {
          const isLast = index === events.length - 1;
          const isActive = event.status === "active";
          const isCompleted = event.status === "completed";

          return (
            <View key={event.id} className="flex-row">
              {/* Icon column */}
              <View className="items-center" style={{ width: 36, marginRight: 12 }}>
                {/* Icon */}
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: isActive
                      ? Colors.sky[100]
                      : isCompleted
                      ? "#F3F4F6"
                      : "#ffffff",
                    borderWidth: isActive ? 0 : 1.5,
                    borderColor: isActive ? "transparent" : isCompleted ? "#E5E7EB" : Colors.sky[300],
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {getIconComponent(event.icon, event.status)}
                </View>

                {/* Connecting line */}
                {!isLast && (
                  <View
                    style={{
                      width: 2,
                      flex: 1,
                      minHeight: 40,
                      backgroundColor: isCompleted ? "#E5E7EB" : Colors.sky[200],
                      marginVertical: 4,
                    }}
                  />
                )}
              </View>

              {/* Content column */}
              <View style={{ flex: 1, paddingBottom: isLast ? 0 : 20 }}>
                <Text
                  className="font-semibold"
                  style={{
                    fontSize: 15,
                    color: isActive ? Colors.tecnibus[800] : isCompleted ? "#9CA3AF" : Colors.tecnibus[700],
                    marginBottom: 4,
                  }}
                >
                  {event.title}
                </Text>
                <Text
                  style={{
                    fontSize: 13,
                    color: isCompleted ? "#D1D5DB" : "#6B7280",
                    marginBottom: event.time ? 6 : 0,
                  }}
                >
                  {event.subtitle}
                </Text>
                {event.time && (
                  <View className="flex-row items-center mt-1">
                    <Clock size={14} color={Colors.sky[600]} strokeWidth={2.5} />
                    <Text
                      className="font-semibold ml-1"
                      style={{ fontSize: 13, color: Colors.sky[700] }}
                    >
                      {event.time}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}
