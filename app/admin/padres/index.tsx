import { Colors } from '@/lib/constants/colors';
import { haptic } from '@/lib/utils/haptics';
import { createShadow } from '@/lib/utils/shadows';
import { useFocusEffect, useRouter } from 'expo-router';
import { ArrowLeft, Plus, Trash2, Users } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from '../../../components/Toast';
import { eliminarUsuario, obtenerPadres, type Profile } from '../../../lib/services/admin.service';

export default function ListaPadresScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const paddingTop = Math.max(insets.top + 8, 48);
  const shadow = createShadow('lg');
  const [padres, setPadres] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' | 'warning' | 'info' }>({
    visible: false,
    message: '',
    type: 'success'
  });

  const cargarPadres = useCallback(async () => {
    try {
      const data = await obtenerPadres();
      setPadres(data);
    } catch (error) {
      setToast({
        visible: true,
        message: 'Error al cargar padres',
        type: 'error',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Recargar lista cuando la pantalla gana foco
  useFocusEffect(
    useCallback(() => {
      cargarPadres();
    }, [cargarPadres])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    cargarPadres();
  }, [cargarPadres]);

  const confirmarEliminar = (padre: Profile) => {
    haptic.medium();
    Alert.alert(
      'Eliminar Padre',
      `¿Estás seguro de eliminar a ${padre.nombre} ${padre.apellido || ''}? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => handleEliminar(padre.id),
        },
      ]
    );
  };

  const handleEliminar = async (userId: string) => {
    setDeletingId(userId);
    const result = await eliminarUsuario(userId);

    if (result.success) {
      setPadres((prev) => prev.filter((p) => p.id !== userId));
      setToast({
        visible: true,
        message: 'Padre eliminado correctamente',
        type: 'success',
      });
    } else {
      setToast({
        visible: true,
        message: result.error || 'Error al eliminar',
        type: 'error',
      });
    }
    setDeletingId(null);
  };

  return (
    <View className="flex-1 bg-padre-50">
      <StatusBar barStyle="light-content" backgroundColor={Colors.padre[700]} translucent={false} />

      {/* Header */}
      <View className="bg-padre-700 pb-6 px-6 rounded-b-3xl" style={[{ paddingTop }, shadow]}>
        <View className="flex-row items-center">
          <TouchableOpacity
            className="bg-padre-600 p-2 rounded-xl mr-4"
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color="#ffffff" strokeWidth={2.5} />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-white text-2xl font-bold">Padres</Text>
            <Text className="text-white text-xl mt-1 ">
              {padres.length} registrados
            </Text>
          </View>
          <TouchableOpacity
            className="bg-padre-600 p-2 rounded-xl"
            onPress={() => router.push('/admin/padres/crear')}
          >
            <Plus size={24} color="#ffffff" strokeWidth={2.5} />
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#9333ea" />
        </View>
      ) : (
        <ScrollView
          className="flex-1 px-6 pt-6"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#9333ea']} />
          }
        >
          {padres.length === 0 ? (
            <View className="bg-white rounded-xl p-8 items-center">
              <Users size={48} color="#9333ea" strokeWidth={1.5} />
              <Text className="text-gray-600 text-center mt-4">
                No hay padres registrados
              </Text>
              <TouchableOpacity
                className="bg-padre-600 py-3 px-6 rounded-xl mt-4"
                onPress={() => router.push('/admin/padres/crear')}
              >
                <Text className="text-white font-semibold">Crear Primer Padre</Text>
              </TouchableOpacity>
            </View>
          ) : (
            padres.map((padre) => (
              <View
                key={padre.id}
                className="bg-white rounded-xl p-4 mb-3 flex-row items-center shadow-sm"
              >
                <View className="bg-padre-100 p-3 rounded-full">
                  <Users size={28} color="#9333ea" strokeWidth={2} />
                </View>
                <View className="flex-1 ml-4">
                  <Text className="text-gray-800 font-bold text-base">{padre.nombre} {padre.apellido}</Text>
                  <Text className="text-gray-500 text-sm">{padre.correo}</Text>
                </View>
                <TouchableOpacity
                  className="bg-red-100 p-2 rounded-xl"
                  onPress={() => confirmarEliminar(padre)}
                  disabled={deletingId === padre.id}
                >
                  {deletingId === padre.id ? (
                    <ActivityIndicator size="small" color="#dc2626" />
                  ) : (
                    <Trash2 size={20} color="#dc2626" strokeWidth={2.5} />
                  )}
                </TouchableOpacity>
              </View>
            ))
          )}
          <View className="h-6" />
        </ScrollView>
      )}

      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast((prev) => ({ ...prev, visible: false }))}
      />
    </View>
  );
}
