import { View, Text, StatusBar, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { 
  Shield,
  Users,
  Bus,
  MapPin,
  UserCircle,
  GraduationCap,
  BarChart3,
  Settings,
  Plus,
  LogOut
} from 'lucide-react-native';
import { Card, AnimatedCard } from '../../components';
import { useAuth } from '../../lib/AuthContext';
import * as Haptics from 'expo-haptics';

export default function AdminHomeScreen() {
  const router = useRouter();
  const { signOut, profile } = useAuth();

  const stats = {
    totalStudents: 156,
    totalDrivers: 12,
    totalParents: 143,
    totalRoutes: 8,
    activeBuses: 6,
  };

  const handleCardPress = (section: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    console.log(`Navegar a: ${section}`);
  };

  const handleLogout = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await signOut();
    router.replace('/login');
  };

  return (
    <View className="flex-1 bg-admin-50">
      <StatusBar barStyle="light-content" backgroundColor="#166534" />
      
      {/* Header */}
      <View className="bg-admin-700 pt-12 pb-6 px-6 rounded-b-3xl shadow-lg">
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-1" />
          
          <TouchableOpacity 
            className="bg-admin-600 p-2 rounded-xl"
            onPress={handleLogout}
          >
            <LogOut size={24} color="#ffffff" strokeWidth={2.5} />
          </TouchableOpacity>
        </View>

        <View className="flex-row items-center">
          <View className="bg-admin-600 p-3 rounded-full mr-4">
            <Shield size={28} color="#ffffff" strokeWidth={2.5} />
          </View>
          <View className="flex-1">
            <Text className="text-white text-2xl font-bold">
              Panel de Administración
            </Text>
            <Text className="text-admin-200 text-sm mt-1">
              {profile?.nombre || 'Institución Educativa'}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>
        {/* Estadísticas Generales */}
        <AnimatedCard delay={0} className="mb-4">
          <Text className="text-lg font-bold text-gray-800 mb-4">
            Estadísticas Generales
          </Text>
          
          <View className="flex-row flex-wrap gap-3">
            {/* Estudiantes */}
            <View className="flex-1 min-w-[45%] bg-primary-50 rounded-xl p-4">
              <View className="flex-row items-center justify-between mb-2">
                <GraduationCap size={24} color="#2563eb" strokeWidth={2.5} />
                <Text className="text-2xl font-bold text-primary-700">
                  {stats.totalStudents}
                </Text>
              </View>
              <Text className="text-gray-600 text-sm font-semibold">
                Estudiantes
              </Text>
            </View>

            {/* Choferes */}
            <View className="flex-1 min-w-[45%] bg-accent-50 rounded-xl p-4">
              <View className="flex-row items-center justify-between mb-2">
                <UserCircle size={24} color="#ca8a04" strokeWidth={2.5} />
                <Text className="text-2xl font-bold text-accent-700">
                  {stats.totalDrivers}
                </Text>
              </View>
              <Text className="text-gray-600 text-sm font-semibold">
                Choferes
              </Text>
            </View>

            {/* Padres */}
            <View className="flex-1 min-w-[45%] bg-purple-50 rounded-xl p-4">
              <View className="flex-row items-center justify-between mb-2">
                <Users size={24} color="#9333ea" strokeWidth={2.5} />
                <Text className="text-2xl font-bold text-purple-700">
                  {stats.totalParents}
                </Text>
              </View>
              <Text className="text-gray-600 text-sm font-semibold">
                Padres
              </Text>
            </View>

            {/* Busetas Activas */}
            <View className="flex-1 min-w-[45%] bg-green-50 rounded-xl p-4">
              <View className="flex-row items-center justify-between mb-2">
                <Bus size={24} color="#16a34a" strokeWidth={2.5} />
                <Text className="text-2xl font-bold text-green-700">
                  {stats.activeBuses}
                </Text>
              </View>
              <Text className="text-gray-600 text-sm font-semibold">
                Busetas Activas
              </Text>
            </View>
          </View>
        </AnimatedCard>

        {/* Gestión Rápida */}
        <AnimatedCard delay={100} className="mb-4">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-bold text-gray-800">
              Gestión Rápida
            </Text>
            <BarChart3 size={20} color="#16a34a" strokeWidth={2.5} />
          </View>

          <View className="gap-3">
            {/* Gestionar Estudiantes */}
            <TouchableOpacity
              className="bg-primary-50 rounded-xl p-4 flex-row items-center justify-between border-2 border-primary-200"
              onPress={() => handleCardPress('estudiantes')}
              activeOpacity={0.7}
            >
              <View className="flex-row items-center flex-1">
                <View className="bg-primary-600 p-2 rounded-lg">
                  <GraduationCap size={24} color="#ffffff" strokeWidth={2.5} />
                </View>
                <View className="ml-3 flex-1">
                  <Text className="text-primary-800 font-bold text-base">
                    Gestionar Estudiantes
                  </Text>
                  <Text className="text-primary-600 text-xs">
                    Agregar, editar o eliminar estudiantes
                  </Text>
                </View>
              </View>
              <Plus size={20} color="#2563eb" strokeWidth={2.5} />
            </TouchableOpacity>

            {/* Gestionar Choferes */}
            <TouchableOpacity
              className="bg-accent-50 rounded-xl p-4 flex-row items-center justify-between border-2 border-accent-200"
              onPress={() => handleCardPress('choferes')}
              activeOpacity={0.7}
            >
              <View className="flex-row items-center flex-1">
                <View className="bg-accent-600 p-2 rounded-lg">
                  <UserCircle size={24} color="#ffffff" strokeWidth={2.5} />
                </View>
                <View className="ml-3 flex-1">
                  <Text className="text-accent-800 font-bold text-base">
                    Gestionar Choferes
                  </Text>
                  <Text className="text-accent-700 text-xs">
                    Administrar conductores y permisos
                  </Text>
                </View>
              </View>
              <Plus size={20} color="#ca8a04" strokeWidth={2.5} />
            </TouchableOpacity>

            {/* Gestionar Padres */}
            <TouchableOpacity
              className="bg-purple-50 rounded-xl p-4 flex-row items-center justify-between border-2 border-purple-200"
              onPress={() => handleCardPress('padres')}
              activeOpacity={0.7}
            >
              <View className="flex-row items-center flex-1">
                <View className="bg-purple-600 p-2 rounded-lg">
                  <Users size={24} color="#ffffff" strokeWidth={2.5} />
                </View>
                <View className="ml-3 flex-1">
                  <Text className="text-purple-800 font-bold text-base">
                    Gestionar Padres
                  </Text>
                  <Text className="text-purple-700 text-xs">
                    Administrar cuentas de padres
                  </Text>
                </View>
              </View>
              <Plus size={20} color="#9333ea" strokeWidth={2.5} />
            </TouchableOpacity>

            {/* Gestionar Rutas */}
            <TouchableOpacity
              className="bg-blue-50 rounded-xl p-4 flex-row items-center justify-between border-2 border-blue-200"
              onPress={() => handleCardPress('rutas')}
              activeOpacity={0.7}
            >
              <View className="flex-row items-center flex-1">
                <View className="bg-blue-600 p-2 rounded-lg">
                  <MapPin size={24} color="#ffffff" strokeWidth={2.5} />
                </View>
                <View className="ml-3 flex-1">
                  <Text className="text-blue-800 font-bold text-base">
                    Gestionar Rutas
                  </Text>
                  <Text className="text-blue-700 text-xs">
                    Configurar recorridos y paradas
                  </Text>
                </View>
              </View>
              <Plus size={20} color="#2563eb" strokeWidth={2.5} />
            </TouchableOpacity>

            {/* Gestionar Busetas */}
            <TouchableOpacity
              className="bg-green-50 rounded-xl p-4 flex-row items-center justify-between border-2 border-green-200"
              onPress={() => handleCardPress('busetas')}
              activeOpacity={0.7}
            >
              <View className="flex-row items-center flex-1">
                <View className="bg-green-600 p-2 rounded-lg">
                  <Bus size={24} color="#ffffff" strokeWidth={2.5} />
                </View>
                <View className="ml-3 flex-1">
                  <Text className="text-green-800 font-bold text-base">
                    Gestionar Busetas
                  </Text>
                  <Text className="text-green-700 text-xs">
                    Registrar vehículos y asignaciones
                  </Text>
                </View>
              </View>
              <Plus size={20} color="#16a34a" strokeWidth={2.5} />
            </TouchableOpacity>
          </View>
        </AnimatedCard>

        {/* Acciones Adicionales */}
        <AnimatedCard delay={200} className="mb-4">
          <Text className="text-lg font-bold text-gray-800 mb-4">
            Otras Acciones
          </Text>

          <View className="gap-3">
            <TouchableOpacity
              className="bg-gray-50 rounded-xl p-4 flex-row items-center justify-between"
              onPress={() => handleCardPress('reportes')}
              activeOpacity={0.7}
            >
              <View className="flex-row items-center">
                <BarChart3 size={20} color="#6b7280" strokeWidth={2.5} />
                <Text className="text-gray-700 font-semibold ml-3">
                  Ver Reportes y Estadísticas
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              className="bg-gray-50 rounded-xl p-4 flex-row items-center justify-between"
              onPress={() => handleCardPress('configuracion')}
              activeOpacity={0.7}
            >
              <View className="flex-row items-center">
                <Settings size={20} color="#6b7280" strokeWidth={2.5} />
                <Text className="text-gray-700 font-semibold ml-3">
                  Configuración de la Institución
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </AnimatedCard>

        {/* Nota informativa */}
        <View className="bg-admin-100 rounded-xl p-4 mb-6">
          <Text className="text-admin-800 text-sm text-center font-semibold">
            🔒 Acceso exclusivo para administradores de la institución
          </Text>
        </View>

        <View className="h-4" />
      </ScrollView>
    </View>
  );
}