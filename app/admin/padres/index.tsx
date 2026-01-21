import { View, Text, StatusBar, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { ArrowLeft, Users, Mail, Plus, Trash2, Edit } from 'lucide-react-native';
import { Toast } from '../../../components';
import { obtenerPadres, eliminarPadre } from '../../../lib/admin';
import * as Haptics from 'expo-haptics';
import type { Profile } from '../../../lib/useProfile';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';


export default function ListaPadresScreen() {
  const router = useRouter();

  const [padres, setPadres] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'warning'>('warning');

  const showToast = (message: string, type: 'success' | 'error' | 'warning') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  const cargarPadres = async () => {
    setIsLoading(true);
    try {
      const data = await obtenerPadres();
      setPadres(data);
    } catch (error) {
      console.error('Error cargando padres:', error);
      showToast('Error al cargar padres', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      cargarPadres();
    }, [])
  );
  

  const handleEliminarPadre = (padre: Profile) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    Alert.alert(
      'Eliminar Padre',
      `¿Estás seguro de que deseas eliminar a ${padre.nombre}?\n\nEsta acción no se puede deshacer.`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(padre.id);
            try {
              const result = await eliminarPadre(padre.id);

              if (result.success) {
                showToast('Padre eliminado exitosamente', 'success');
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                // Recargar lista
                await cargarPadres();
              } else {
                showToast(result.error || 'Error al eliminar padre', 'error');
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              }
            } catch (error) {
              console.error('Error eliminando padre:', error);
              showToast('Error al eliminar padre', 'error');
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            } finally {
              setIsDeleting(null);
            }
          },
        },
      ]
    );
  };

  const handleEditarPadre = (padre: Profile) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    showToast('Función de edición próximamente', 'warning');
    // TODO: Implementar edición
    // router.push(`/admin/padres/editar/${padre.id}`);
  };

  const handleCrearNuevo = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/admin/padres/crear');
  };

  return (
    <View className="flex-1 bg-purple-50">
      <StatusBar barStyle="light-content" backgroundColor="#581c87" />

      <Toast
        visible={toastVisible}
        message={toastMessage}
        type={toastType}
        onHide={() => setToastVisible(false)}
      />

      {/* Header */}
      <View className="bg-purple-600 pt-12 pb-6 px-6 rounded-b-3xl shadow-lg">
        <View className="flex-row items-center mb-4">
          <TouchableOpacity
            onPress={() => router.replace('/admin')}
            className="bg-purple-700 p-2 rounded-xl mr-4"
          >
            <ArrowLeft size={24} color="#ffffff" strokeWidth={2.5} />
          </TouchableOpacity>

          <View className="flex-1">
            <Text className="text-white text-2xl font-bold">
              Padres
            </Text>
            <Text className="text-purple-100 text-sm mt-1">
              {padres.length} {padres.length === 1 ? 'padre registrado' : 'padres registrados'}
            </Text>
          </View>

          <TouchableOpacity
            onPress={handleCrearNuevo}
            className="bg-purple-500 p-3 rounded-xl"
          >
            <Plus size={24} color="#ffffff" strokeWidth={2.5} />
          </TouchableOpacity>
        </View>
      </View>

      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#9333ea" />
          <Text className="text-purple-600 mt-4 font-semibold">
            Cargando padres...
          </Text>
        </View>
      ) : padres.length === 0 ? (
        <View className="flex-1 justify-center items-center px-6">
          <View className="bg-purple-100 p-6 rounded-full mb-4">
            <Users size={64} color="#9333ea" strokeWidth={1.5} />
          </View>
          <Text className="text-2xl font-bold text-gray-800 mb-2 text-center">
            No hay padres registrados
          </Text>
          <Text className="text-gray-600 text-center mb-6">
            Comienza agregando tu primer padre
          </Text>
          <TouchableOpacity
            onPress={handleCrearNuevo}
            className="bg-purple-600 px-6 py-3 rounded-xl flex-row items-center"
          >
            <Plus size={20} color="#ffffff" strokeWidth={2.5} />
            <Text className="text-white font-bold ml-2">
              Crear Primer Padre
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>
          {padres.map((padre, index) => (
            <View
              key={padre.id}
              className="bg-white rounded-2xl p-4 mb-4 shadow-md border border-gray-100"
            >
              <View className="flex-row items-start">
                {/* Avatar */}
                <View className="bg-purple-100 p-3 rounded-full">
                  <Users size={32} color="#9333ea" strokeWidth={2} />
                </View>

                {/* Info */}
                <View className="flex-1 ml-3">
                  <Text className="text-lg font-bold text-gray-800 mb-1">
                    {padre.nombre}
                  </Text>

                  <View className="flex-row items-center mb-1">
                    <Mail size={14} color="#6b7280" />
                    <Text className="text-sm text-gray-600 ml-1">
                      {padre.correo}
                    </Text>
                  </View>

                  <Text className="text-xs text-gray-500">
                    Registrado: {new Date(padre.created_at).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </Text>
                </View>
              </View>

              {/* Acciones */}
              <View className="flex-row mt-4 gap-2">
                <TouchableOpacity
                  onPress={() => handleEditarPadre(padre)}
                  className="flex-1 bg-blue-50 py-2 px-4 rounded-xl flex-row items-center justify-center border border-blue-200"
                  activeOpacity={0.7}
                >
                  <Edit size={16} color="#2563eb" strokeWidth={2.5} />
                  <Text className="text-blue-700 font-semibold ml-2 text-sm">
                    Editar
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleEliminarPadre(padre)}
                  disabled={isDeleting === padre.id}
                  className={`flex-1 py-2 px-4 rounded-xl flex-row items-center justify-center border ${
                    isDeleting === padre.id
                      ? 'bg-gray-100 border-gray-200'
                      : 'bg-red-50 border-red-200'
                  }`}
                  activeOpacity={0.7}
                >
                  {isDeleting === padre.id ? (
                    <>
                      <ActivityIndicator size="small" color="#6b7280" />
                      <Text className="text-gray-500 font-semibold ml-2 text-sm">
                        Eliminando...
                      </Text>
                    </>
                  ) : (
                    <>
                      <Trash2 size={16} color="#dc2626" strokeWidth={2.5} />
                      <Text className="text-red-700 font-semibold ml-2 text-sm">
                        Eliminar
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ))}

          <View className="h-4" />
        </ScrollView>
      )}
    </View>
  );
}
