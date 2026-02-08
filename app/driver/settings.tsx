import { haptic } from '@/lib/utils/haptics';
import { createShadow } from '@/lib/utils/shadows';
import { useRouter } from 'expo-router';
import {
  ChevronRight,
  LogOut,
  UserCircle
} from 'lucide-react-native';
import { ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedCard } from '../../components';
import { useAuth } from '../../contexts/AuthContext';

export default function DriverSettingsScreen() {
  const router = useRouter();
  const { signOut, profile } = useAuth();
  const insets = useSafeAreaInsets();
  const paddingTop = Math.max(insets.top + 8, 48);
  const shadow = createShadow('lg');

  const handleLogout = async () => {
    haptic.warning();
    await signOut();
    // AuthGuard se encarga del redirect automáticamente
  };

  const handleViewProfile = () => {
    haptic.light();
    router.push('/driver/perfil');
  };

  return (
    <View className="flex-1 bg-chofer-50">
      <StatusBar barStyle="light-content" backgroundColor="#854d0e" />

      {/* Header */}
      <View className="bg-chofer-600 pb-6 px-6 rounded-b-3xl" style={[{ paddingTop }, shadow]}>
        <View className="flex-row items-center">
          <View className="bg-chofer-700 p-3 rounded-full mr-4">
            <UserCircle size={28} color="#ffffff" strokeWidth={2.5} />
          </View>
          <View className="flex-1">
            <Text className="text-white text-2xl font-bold">
              Configuración
            </Text>
            <Text className="text-chofer-200 text-sm mt-1">
              {profile?.nombre} {profile?.apellido}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>
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
              <View className="bg-chofer-100 p-2 rounded-lg">
                <UserCircle size={24} color="#ca8a04" strokeWidth={2.5} />
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
          <Text className="text-lg font-bold text-gray-800 mb-4">
            Sesión
          </Text>

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
                  Salir de tu cuenta de chofer
                </Text>
              </View>
            </View>
            <ChevronRight size={20} color="#dc2626" strokeWidth={2.5} />
          </TouchableOpacity>
        </AnimatedCard>

        {/* Nota informativa */}
        <View className="bg-chofer-100 rounded-xl p-4 mb-6">
          <Text className="text-chofer-800 text-sm text-center font-semibold">
            🚐 Configuración de cuenta de chofer
          </Text>
        </View>

        <View className="h-4" />
      </ScrollView>
    </View>
  );
}
