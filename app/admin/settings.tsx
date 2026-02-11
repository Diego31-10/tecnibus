import { Colors } from "@/lib/constants/colors";
import { haptic } from "@/lib/utils/haptics";
import { createShadow } from "@/lib/utils/shadows";
import { useRouter } from "expo-router";
import { ArrowLeft, ChevronRight, LogOut, User } from "lucide-react-native";
import {
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AnimatedCard } from "../../components";
import { useAuth } from "../../contexts/AuthContext";

export default function AdminSettingsScreen() {
  const router = useRouter();
  const { signOut, profile } = useAuth();
  const insets = useSafeAreaInsets();

  const paddingTop = Math.max(insets.top + 8, 48);
  const shadow = createShadow("lg");

  const handleLogout = async () => {
    haptic.warning();
    await signOut();
    // AuthGuard se encarga del redirect automáticamente
  };

  const handleViewProfile = () => {
    haptic.light();
    router.push("/admin/perfil");
  };

  return (
    <View className="flex-1 bg-tecnibus-50">
      <StatusBar
        barStyle="light-content"
        backgroundColor={Colors.tecnibus[700]}
        translucent={false}
      />

      {/* Header */}
      <View
        className="bg-tecnibus-700 pb-6 px-6 rounded-b-3xl"
        style={[{ paddingTop }, shadow]}
      >
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => router.back()}
            className="bg-tecnibus-600 p-3 rounded-xl mr-4 "
          >
            <ArrowLeft size={24} color="#ffffff" strokeWidth={2.5} />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-white text-2xl font-bold">Configuración</Text>
            <Text className="text-white text-xl mt-1">
              {profile?.nombre} {profile?.apellido}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        className="flex-1 px-6 pt-6"
        showsVerticalScrollIndicator={false}
      >
        {/* Sección Cuenta */}
        <AnimatedCard delay={0} className="mb-4">
          <Text className="text-lg font-bold text-gray-800 mb-4">
            Mi Cuenta
          </Text>

          {/* Ver/Editar Perfil */}
          <TouchableOpacity
            className="bg-gray-50 rounded-xl p-4 flex-row items-center justify-between mb-3"
            onPress={handleViewProfile}
            activeOpacity={0.7}
          >
            <View className="flex-row items-center flex-1">
              <View className="bg-tecnibus-100 p-2 rounded-lg">
                <User size={24} color="#16a34a" strokeWidth={2.5} />
              </View>
              <View className="ml-3 flex-1">
                <Text className="text-gray-800 font-bold text-base">
                  Ver Mi Perfil
                </Text>
                <Text className="text-gray-500 text-xs">
                  Editar información personal
                </Text>
              </View>
            </View>
            <ChevronRight size={20} color="#9ca3af" strokeWidth={2.5} />
          </TouchableOpacity>
        </AnimatedCard>

        {/* Sección Sesión */}
        <AnimatedCard delay={100} className="mb-4">
          <Text className="text-lg font-bold text-gray-800 mb-4">Sesión</Text>

          {/* Cerrar Sesión */}
          <TouchableOpacity
            className="bg-red-50 rounded-xl p-4 flex-row items-center justify-between border-2 border-red-200"
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <View className="flex-row items-center flex-1">
              <View className="bg-red-500 p-2 rounded-lg">
                <LogOut size={24} color="#ffffff" strokeWidth={2.5} />
              </View>
              <View className="ml-3 flex-1">
                <Text className="text-red-700 font-bold text-base">
                  Cerrar Sesión
                </Text>
                <Text className="text-red-600 text-xs">
                  Salir de tu cuenta de administrador
                </Text>
              </View>
            </View>
            <ChevronRight size={20} color="#dc2626" strokeWidth={2.5} />
          </TouchableOpacity>
        </AnimatedCard>

        {/* Nota informativa */}
        <View className="bg-tecnibus-100 rounded-xl p-4 mb-6">
          <Text className="text-tecnibus-800 text-sm text-center font-semibold">
            🔒 Configuración de administrador
          </Text>
        </View>

        <View className="h-4" />
      </ScrollView>
    </View>
  );
}
