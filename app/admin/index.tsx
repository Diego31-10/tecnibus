import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import {
  BarChart3,
  Bus,
  GraduationCap,
  List,
  MapPin,
  Plus,
  RefreshCw,
  Settings,
  Shield,
  UserCircle,
  Users
} from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { AnimatedCard } from '../../components';
import { useAuth } from '../../lib/contexts/AuthContext';
import { DashboardStats, getDashboardStats } from '../../lib/services/stats.service';

export default function AdminHomeScreen() {
  const router = useRouter();
  const { signOut, profile } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    totalDrivers: 0,
    totalParents: 0,
    totalRoutes: 0,
    activeBuses: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    const data = await getDashboardStats();
    setStats(data);
    setLoading(false);
  };

  const handleRefresh = async () => {
    if (refreshing) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  };

  const handleCardPress = (section: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (section === 'estudiantes') {
      router.push('/admin/estudiantes');
    } else {
      console.log(`Navegar a: ${section}`);
    }
  };

  const handleSettings = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/admin/settings');
  };

  return (
    <View className="flex-1 bg-admin-50">
      <StatusBar barStyle="light-content" backgroundColor="#166534" />
      
      {/* Header */}
      <View className="bg-admin-700 pt-20 pb-6 px-6 rounded-b-3xl shadow-lg">
        <View className="flex-row items-center">
          <View className="p-3 mr-4">
            <Shield size={28} color="#ffffff" strokeWidth={2.5} />
          </View>
        
          <View className="flex-1">
            <Text className="text-white text-2xl font-bold">
              Panel de Administración
            </Text>
            <Text className="text-white text-xl mt-1">
              {'¡Hola '+ profile?.nombre+'!' || 'Institución Educativa'}
            </Text>
          </View>
          <TouchableOpacity
            className="bg-admin-600 p-2 rounded-xl"
            onPress={handleSettings}
          >
            <Settings size={24} color="#ffffff" strokeWidth={2.5} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>
        {/* Estadísticas Generales */}
        <AnimatedCard delay={0} className="mb-4">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-bold text-gray-800">
              Estadísticas Generales
            </Text>
            <TouchableOpacity
              onPress={handleRefresh}
              className={`bg-admin-100 p-2 rounded-lg ${refreshing && 'opacity-60'}`}
              disabled={refreshing}
            >
              <RefreshCw
                size={20}
                color="#16a34a"
                strokeWidth={2.5}
                className={refreshing ? 'animate-spin' : ''}
              />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View className="py-8 items-center">
              <ActivityIndicator size="large" color="#16a34a" />
              <Text className="text-gray-500 mt-4">Cargando estadísticas...</Text>
            </View>
          ) : (
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
          )}
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
            <View className="bg-primary-50 rounded-xl p-4 border-2 border-primary-100">
              <View className="flex-row items-center mb-3">
                <View className="bg-primary-600 p-2 rounded-lg">
                  <GraduationCap size={24} color="#ffffff" strokeWidth={2.5} />
                </View>
                <View className="ml-3 flex-1">
                  <Text className="text-primary-800 font-bold text-base">
                    Gestionar Estudiantes
                  </Text>
                  <Text className="text-primary-700 text-xs">
                    Administrar estudiantes y asignaciones
                  </Text>
                </View>
              </View>

              <View className="flex-row gap-2">
                <TouchableOpacity
                  className="flex-1 bg-primary-600 py-2 px-3 rounded-lg flex-row items-center justify-center"
                  onPress={() => router.push('/admin/estudiantes')}
                  activeOpacity={0.7}
                >
                  <List size={16} color="#ffffff" strokeWidth={2.5} />
                  <Text className="text-white font-semibold ml-2 text-sm">
                    Ver Lista
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  className="flex-1 bg-primary-700 py-2 px-3 rounded-lg flex-row items-center justify-center"
                  onPress={() => router.push('/admin/estudiantes/crear')}
                  activeOpacity={0.7}
                >
                  <Plus size={16} color="#ffffff" strokeWidth={2.5} />
                  <Text className="text-white font-semibold ml-2 text-sm">
                    Crear Nuevo
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Gestionar Choferes */}
            <View className="bg-accent-50 rounded-xl p-4 border-2 border-accent-100">
              <View className="flex-row items-center mb-3">
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

              <View className="flex-row gap-2">
                <TouchableOpacity
                  className="flex-1 bg-accent-600 py-2 px-3 rounded-lg flex-row items-center justify-center"
                  onPress={() => router.push('/admin/choferes')}
                  activeOpacity={0.7}
                >
                  <List size={16} color="#ffffff" strokeWidth={2.5} />
                  <Text className="text-white font-semibold ml-2 text-sm">
                    Ver Lista
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  className="flex-1 bg-accent-700 py-2 px-3 rounded-lg flex-row items-center justify-center"
                  onPress={() => router.push('/admin/choferes/crear')}
                  activeOpacity={0.7}
                >
                  <Plus size={16} color="#ffffff" strokeWidth={2.5} />
                  <Text className="text-white font-semibold ml-2 text-sm">
                    Crear Nuevo
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Gestionar Padres */}
            <View className="bg-purple-50 rounded-xl p-4 border-2 border-purple-200">
              <View className="flex-row items-center mb-3">
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

              <View className="flex-row gap-2">
                <TouchableOpacity
                  className="flex-1 bg-purple-600 py-2 px-3 rounded-lg flex-row items-center justify-center"
                  onPress={() => router.push('/admin/padres')}
                  activeOpacity={0.7}
                >
                  <List size={16} color="#ffffff" strokeWidth={2.5} />
                  <Text className="text-white font-semibold ml-2 text-sm">
                    Ver Lista
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  className="flex-1 bg-purple-700 py-2 px-3 rounded-lg flex-row items-center justify-center"
                  onPress={() => router.push('/admin/padres/crear')}
                  activeOpacity={0.7}
                >
                  <Plus size={16} color="#ffffff" strokeWidth={2.5} />
                  <Text className="text-white font-semibold ml-2 text-sm">
                    Crear Nuevo
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

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