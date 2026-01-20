import { View, Text, TextInput, StatusBar, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { ArrowLeft, Users, Mail, Lock, User } from 'lucide-react-native';
import { Toast } from '../../../components';
import { crearUsuario } from '../../../lib/admin';
import * as Haptics from 'expo-haptics';

export default function CrearPadreScreen() {
  const router = useRouter();
  
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'warning'>('warning');

  const showToast = (message: string, type: 'success' | 'error' | 'warning') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  const handleCrearPadre = async () => {
    // Validaciones
    if (!nombre.trim()) {
      showToast('⚠️ Ingresa el nombre completo', 'warning');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    if (!email.trim()) {
      showToast('⚠️ Ingresa el correo electrónico', 'warning');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      showToast('⚠️ Formato de correo inválido', 'warning');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    if (!password) {
      showToast('⚠️ Ingresa una contraseña', 'warning');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    if (password.length < 6) {
      showToast('⚠️ La contraseña debe tener mínimo 6 caracteres', 'warning');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    setIsLoading(true);

    try {
      // Llamar a la Edge Function
      const result = await crearUsuario({
        nombre: nombre.trim(),
        email: email.trim().toLowerCase(),
        password,
        rol: 'padre',
      });

      if (!result.success) {
        showToast(`❌ ${result.error}`, 'error');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setIsLoading(false);
        return;
      }

      // Éxito
      showToast('✅ Padre creado exitosamente', 'success');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Limpiar formulario
      setNombre('');
      setEmail('');
      setPassword('');

      setTimeout(() => {
        setIsLoading(false);
        router.back();
      }, 2000);

    } catch (error) {
      console.error('❌ Error creando padre:', error);
      showToast('❌ Error al crear padre', 'error');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setIsLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-primary-50">
      <StatusBar barStyle="light-content" backgroundColor="#1e40af" />
      
      <Toast
        visible={toastVisible}
        message={toastMessage}
        type={toastType}
        onHide={() => setToastVisible(false)}
      />

      {/* Header */}
      <View className="bg-primary-700 pt-12 pb-6 px-6 rounded-b-3xl shadow-lg">
        <View className="flex-row items-center mb-4">
          <TouchableOpacity 
            onPress={() => router.back()}
            className="bg-primary-600 p-2 rounded-xl mr-4"
          >
            <ArrowLeft size={24} color="#ffffff" strokeWidth={2.5} />
          </TouchableOpacity>
          
          <View className="flex-1">
            <Text className="text-white text-2xl font-bold">
              Crear Nuevo Padre
            </Text>
            <Text className="text-primary-200 text-sm mt-1">
              Completa los datos del padre de familia
            </Text>
          </View>
        </View>
      </View>

      <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>
        {/* Formulario */}
        <View className="bg-white rounded-3xl p-6 shadow-lg mb-6">
          {/* Nombre Completo */}
          <View className="mb-4">
            <Text className="text-sm font-semibold text-gray-700 mb-2">
              Nombre Completo
            </Text>
            <View className="flex-row items-center bg-gray-50 rounded-xl px-4 py-3 border border-gray-200">
              <User size={20} color="#6b7280" />
              <TextInput
                className="flex-1 ml-3 text-base text-gray-800"
                placeholder="Ej: María González"
                placeholderTextColor="#9ca3af"
                value={nombre}
                onChangeText={setNombre}
                editable={!isLoading}
              />
            </View>
          </View>

          {/* Email */}
          <View className="mb-4">
            <Text className="text-sm font-semibold text-gray-700 mb-2">
              Correo Electrónico
            </Text>
            <View className="flex-row items-center bg-gray-50 rounded-xl px-4 py-3 border border-gray-200">
              <Mail size={20} color="#6b7280" />
              <TextInput
                className="flex-1 ml-3 text-base text-gray-800"
                placeholder="padre@ejemplo.com"
                placeholderTextColor="#9ca3af"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!isLoading}
              />
            </View>
          </View>

          {/* Contraseña */}
          <View className="mb-4">
            <Text className="text-sm font-semibold text-gray-700 mb-2">
              Contraseña Temporal
            </Text>
            <View className="flex-row items-center bg-gray-50 rounded-xl px-4 py-3 border border-gray-200">
              <Lock size={20} color="#6b7280" />
              <TextInput
                className="flex-1 ml-3 text-base text-gray-800"
                placeholder="Mínimo 6 caracteres"
                placeholderTextColor="#9ca3af"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                editable={!isLoading}
              />
            </View>
            <Text className="text-xs text-gray-500 mt-2">
              El padre podrá cambiarla después del primer inicio de sesión
            </Text>
          </View>

          {/* Info Box */}
          <View className="bg-primary-50 rounded-xl p-4 border border-primary-200">
            <View className="flex-row items-start">
              <Users size={20} color="#2563eb" strokeWidth={2.5} />
              <View className="flex-1 ml-3">
                <Text className="text-primary-800 font-semibold text-sm mb-1">
                  Rol: Padre
                </Text>
                <Text className="text-primary-700 text-xs">
                  Este usuario tendrá acceso al monitoreo de transporte de sus hijos.
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Botón Crear */}
        <TouchableOpacity
          className={`py-4 rounded-xl shadow-md mb-6 ${
            isLoading ? 'bg-gray-300' : 'bg-primary-600'
          }`}
          onPress={handleCrearPadre}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <View className="flex-row items-center justify-center">
              <ActivityIndicator size="small" color="#ffffff" />
              <Text className="text-white text-lg font-bold ml-2">
                Creando padre...
              </Text>
            </View>
          ) : (
            <Text className="text-white text-center text-lg font-bold">
              Crear Padre
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}