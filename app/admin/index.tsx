import { Colors } from '@/lib/constants/colors';
import { haptic } from '@/lib/utils/haptics';
import { createShadow } from '@/lib/utils/shadows';
import { useRouter } from 'expo-router';
import {
  BarChart3,
  Bus,
  GraduationCap,
  List,
  MapPin,
  Megaphone,
  Navigation,
  Plus,
  RefreshCw,
  Settings,
  Shield,
  UserCircle,
  Users
} from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedCard } from '../../components';
import { useAuth } from '../../contexts/AuthContext';
import { DashboardStats, getDashboardStats } from '../../lib/services/stats.service';

export default function AdminHomeScreen() {
  const router = useRouter();
  const { signOut, profile } = useAuth();
  const insets = useSafeAreaInsets();
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    totalDrivers: 0,
    totalParents: 0,
    totalRoutes: 0,
    activeBuses: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const paddingTop = Math.max(insets.top + 8, 48);
  const shadow = createShadow('lg');

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

    haptic.light();
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  };

  const handleCardPress = (section: string) => {
    haptic.light();

    switch (section) {
      case 'estudiantes':
        router.push('/admin/estudiantes');
        break;
      case 'rutas':
        router.push('/admin/rutas');
        break;
      case 'busetas':
        router.push('/admin/busetas');
        break;
      case 'choferes':
        router.push('/admin/choferes');
        break;
      case 'padres':
        router.push('/admin/padres');
        break;
      default:
        console.log(`Navegar a: ${section}`);
    }
  };

  const handleSettings = () => {
    haptic.light();
    router.push('/admin/settings');
  };

  return (
    <View className="flex-1 bg-admin-50">
      <StatusBar barStyle="light-content" backgroundColor={Colors.admin[700]} />
      
      {/* Header */}
      <View className="bg-admin-700 pb-6 px-6 rounded-b-3xl" style={[{ paddingTop }, shadow]}>
        <View className="flex-row items-center">
          <View className="p-3 mr-4">
            <Shield size={28} color="#ffffff" strokeWidth={2.5} />
          </View>
        
          <View className="flex-1 ">
            <Text className="text-white text-2xl font-bold ">
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
              className={`bg-gray-100 p-2 rounded-lg ${refreshing && 'opacity-60'}`}
              disabled={refreshing}
            >
              <RefreshCw
                size={20}
                color="black"
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
            <View className="flex-1 min-w-[45%] bg-estudiante-50 rounded-xl p-4">
              <View className="flex-row items-center justify-between mb-2">
                <GraduationCap size={24} color={Colors.estudiante[700]} strokeWidth={2.5} />
                <Text className="text-2xl font-bold text-estudiante-700">
                  {stats.totalStudents}
                </Text>
              </View>
              <Text className="text-gray-600 text-sm font-semibold">
                Estudiantes
              </Text>
            </View>

            {/* Choferes */}
            <View className="flex-1 min-w-[45%] bg-chofer-50 rounded-xl p-4">
              <View className="flex-row items-center justify-between mb-2">
                <UserCircle size={24} color="#ca8a04" strokeWidth={2.5} />
                <Text className="text-2xl font-bold text-chofer-700">
                  {stats.totalDrivers}
                </Text>
              </View>
              <Text className="text-gray-600 text-sm font-semibold">
                Choferes
              </Text>
            </View>

            {/* Padres */}
            <View className="flex-1 min-w-[45%] bg-padre-50 rounded-xl p-4">
              <View className="flex-row items-center justify-between mb-2">
                <Users size={24} color="#9333ea" strokeWidth={2.5} />
                <Text className="text-2xl font-bold text-padre-700">
                  {stats.totalParents}
                </Text>
              </View>
              <Text className="text-gray-600 text-sm font-semibold">
                Padres
              </Text>
            </View>

            {/* Busetas Activas */}
            <View className="flex-1 min-w-[45%] bg-buseta-50 rounded-xl p-4">
              <View className="flex-row items-center justify-between mb-2">
                <Bus size={24} color="#279150" strokeWidth={2.5} />
                <Text className="text-2xl font-bold text-buseta-700">
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
            <BarChart3 size={20} color="black" strokeWidth={2.5} />
          </View>

          <View className="gap-3">
            {/* Gestionar Estudiantes */}
            <View className="bg-estudiante-50 rounded-xl p-4 border-2 border-estudiante-100">
              <View className="flex-row items-center mb-3">
                <View className="bg-estudiante-600 p-2 rounded-lg">
                  <GraduationCap size={24} color="#ffffff" strokeWidth={2.5} />
                </View>
                <View className="ml-3 flex-1">
                  <Text className="text-estudiante-800 font-bold text-base">
                    Gestionar Estudiantes
                  </Text>
                  <Text className="text-estudiante-700 text-xs">
                    Administrar estudiantes y asignaciones
                  </Text>
                </View>
              </View>

              <View className="flex-row gap-2">
                <TouchableOpacity
                  className="flex-1 bg-estudiante-600 py-2 px-3 rounded-lg flex-row items-center justify-center"
                  onPress={() => router.push('/admin/estudiantes')}
                  activeOpacity={0.7}
                >
                  <List size={16} color="#ffffff" strokeWidth={2.5} />
                  <Text className="text-white font-semibold ml-2 text-sm">
                    Ver Lista
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  className="flex-1 bg-estudiante-700 py-2 px-3 rounded-lg flex-row items-center justify-center"
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
            <View className="bg-chofer-50 rounded-xl p-4 border-2 border-chofer-100">
              <View className="flex-row items-center mb-3">
                <View className="bg-chofer-600 p-2 rounded-lg">
                  <UserCircle size={24} color="#ffffff" strokeWidth={2.5} />
                </View>
                <View className="ml-3 flex-1">
                  <Text className="text-chofer-800 font-bold text-base">
                    Gestionar Choferes
                  </Text>
                  <Text className="text-chofer-700 text-xs">
                    Administrar conductores y permisos
                  </Text>
                </View>
              </View>

              <View className="flex-row gap-2">
                <TouchableOpacity
                  className="flex-1 bg-chofer-600 py-2 px-3 rounded-lg flex-row items-center justify-center"
                  onPress={() => router.push('/admin/choferes')}
                  activeOpacity={0.7}
                >
                  <List size={16} color="#ffffff" strokeWidth={2.5} />
                  <Text className="text-white font-semibold ml-2 text-sm">
                    Ver Lista
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  className="flex-1 bg-chofer-700 py-2 px-3 rounded-lg flex-row items-center justify-center"
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
            <View className="bg-padre-50 rounded-xl p-4 border-2 border-padre-100">
              <View className="flex-row items-center mb-3">
                <View className="bg-padre-600 p-2 rounded-lg">
                  <Users size={24} color="#ffffff" strokeWidth={2.5} />
                </View>
                <View className="ml-3 flex-1">
                  <Text className="text-padre-800 font-bold text-base">
                    Gestionar Padres
                  </Text>
                  <Text className="text-padre-700 text-xs">
                    Administrar cuentas de padres
                  </Text>
                </View>
              </View>

              <View className="flex-row gap-2">
                <TouchableOpacity
                  className="flex-1 bg-padre-600 py-2 px-3 rounded-lg flex-row items-center justify-center"
                  onPress={() => router.push('/admin/padres')}
                  activeOpacity={0.7}
                >
                  <List size={16} color="#ffffff" strokeWidth={2.5} />
                  <Text className="text-white font-semibold ml-2 text-sm">
                    Ver Lista
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  className="flex-1 bg-padre-700 py-2 px-3 rounded-lg flex-row items-center justify-center"
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
            {/* Gestionar Busetas */}
            <View className="bg-buseta-50 rounded-xl p-4 border-2 border-buseta-100">
              <View className="flex-row items-center mb-3">
                <View className="bg-buseta-600 p-2 rounded-lg">
                  <Bus size={24} color="#ffffff" strokeWidth={2.5} />
                </View>
                <View className="ml-3 flex-1">
                  <Text className="text-buseta-800 font-bold text-base">
                    Gestionar Busetas
                  </Text>
                  <Text className="text-buseta-700 text-xs">
                    Administrar vehículos y capacidad
                  </Text>
                </View>
              </View>

              <View className="flex-row gap-2">
                <TouchableOpacity
                  className="flex-1 bg-buseta-600 py-2 px-3 rounded-lg flex-row items-center justify-center"
                  onPress={() => router.push('/admin/busetas')}
                  activeOpacity={0.7}
                >
                  <List size={16} color="#ffffff" strokeWidth={2.5} />
                  <Text className="text-white font-semibold ml-2 text-sm">
                    Ver Lista
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  className="flex-1 bg-buseta-700 py-2 px-3 rounded-lg flex-row items-center justify-center"
                  onPress={() => router.push('/admin/busetas/crear')}
                  activeOpacity={0.7}
                >
                  <Plus size={16} color="#ffffff" strokeWidth={2.5} />
                  <Text className="text-white font-semibold ml-2 text-sm">
                    Crear Nueva
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            {/* Gestionar Rutas */}
            <View className="bg-ruta-50 rounded-xl p-4 border-2 border-ruta-100">
              <View className="flex-row items-center mb-3">
                <View className="bg-ruta-600 p-2 rounded-lg">
                  <MapPin size={24} color="#ffffff" strokeWidth={2.5} />
                </View>
                <View className="ml-3 flex-1">
                  <Text className="text-ruta-800 font-bold text-base">
                    Gestionar Rutas
                  </Text>
                  <Text className="text-ruta-700 text-xs">
                    Configurar recorridos y paradas
                  </Text>
                </View>
              </View>

              <View className="flex-row gap-2">
                <TouchableOpacity
                  className="flex-1 bg-ruta-600 py-2 px-3 rounded-lg flex-row items-center justify-center"
                  onPress={() => router.push('/admin/rutas')}
                  activeOpacity={0.7}
                >
                  <List size={16} color="#ffffff" strokeWidth={2.5} />
                  <Text className="text-white font-semibold ml-2 text-sm">
                    Ver Lista
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  className="flex-1 bg-ruta-700 py-2 px-3 rounded-lg flex-row items-center justify-center"
                  onPress={() => router.push('/admin/rutas/crear')}
                  activeOpacity={0.7}
                >
                  <Plus size={16} color="#ffffff" strokeWidth={2.5} />
                  <Text className="text-white font-semibold ml-2 text-sm">
                    Crear Nueva
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Enviar Anuncios */}
            <TouchableOpacity
              className="bg-admin-50 rounded-xl p-4 border-2 border-admin-200"
              onPress={() => {
                haptic.light();
                router.push('/admin/anuncios');
              }}
              activeOpacity={0.7}
            >
              <View className="flex-row items-center mb-3">
                <View className="bg-admin-600 p-2 rounded-lg">
                  <Megaphone size={24} color="#ffffff" strokeWidth={2.5} />
                </View>
                <View className="ml-3 flex-1">
                  <Text className="text-admin-800 font-bold text-base">
                    📢 Enviar Anuncios
                  </Text>
                  <Text className="text-admin-700 text-xs">
                    Notificaciones push a padres y choferes
                  </Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* Gestionar Asignaciones */}
            <View className="bg-asign-50 rounded-xl p-4 border-2 border-asign-100">
              <View className="flex-row items-center mb-3">
                <View className="bg-asign-600 p-2 rounded-lg">
                  <Navigation size={24} color="#ffffff" strokeWidth={2.5} />
                </View>
                <View className="ml-3 flex-1">
                  <Text className="text-asign-800 font-bold text-base">
                    Gestionar Asignaciones
                  </Text>
                  <Text className="text-asign-700 text-xs">
                    Asignar busetas y recorridos a choferes
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                className="bg-asign-600 py-2 px-3 rounded-lg flex-row items-center justify-center"
                onPress={() => router.push('/admin/asignaciones')}
                activeOpacity={0.7}
              >
                <Settings size={16} color="#ffffff" strokeWidth={2.5} />
                <Text className="text-white font-semibold ml-2 text-sm">
                  Configurar
                </Text>
              </TouchableOpacity>
            </View>
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