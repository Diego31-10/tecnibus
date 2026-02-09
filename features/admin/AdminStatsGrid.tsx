import { View } from "react-native";
import { StatCard } from "@/components/ui/StatCard";
import { Bus, GraduationCap, User, Users } from "lucide-react-native";
import { DashboardStats } from "@/lib/services/stats.service";

interface AdminStatsGridProps {
  stats: DashboardStats;
  onStudentsPress: () => void;
  onDriversPress: () => void;
  onParentsPress: () => void;
  onBusesPress: () => void;
}

export function AdminStatsGrid({
  stats,
  onStudentsPress,
  onDriversPress,
  onParentsPress,
  onBusesPress,
}: AdminStatsGridProps) {
  return (
    <View style={{ paddingHorizontal: 20, marginTop: -36, zIndex: 10 }}>
      <View className="flex-row" style={{ gap: 12, marginBottom: 12 }}>
        <StatCard
          icon={GraduationCap}
          iconColor="#7C3AED"
          iconBgColor="#EDE9FE"
          value={stats.totalStudents}
          label="ESTUDIANTES"
          onPress={onStudentsPress}
        />
        <StatCard
          icon={User}
          iconColor="#D97706"
          iconBgColor="#FEF3C7"
          value={stats.totalDrivers}
          label="CONDUCTORES"
          onPress={onDriversPress}
        />
      </View>
      <View className="flex-row" style={{ gap: 12 }}>
        <StatCard
          icon={Users}
          iconColor="#2563EB"
          iconBgColor="#DBEAFE"
          value={stats.totalParents}
          label="PADRES"
          onPress={onParentsPress}
        />
        <StatCard
          icon={Bus}
          iconColor="#059669"
          iconBgColor="#D1FAE5"
          value={stats.activeBuses}
          label="BUSES"
          onPress={onBusesPress}
        />
      </View>
    </View>
  );
}
