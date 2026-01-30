import { haptic } from '@/lib/utils/haptics';
import { createShadow } from '@/lib/utils/shadows';
import { useRouter } from 'expo-router';
import { ArrowLeft, Eye, EyeOff, Lock, Mail, Save, User } from 'lucide-react-native';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from '../../../components/Toast';
import { crearUsuario } from '../../../lib/services/admin.service';

export default function CrearPadreScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const paddingTop = Math.max(insets.top + 8, 48);
  const shadow = createShadow('lg');
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' | 'warning' | 'info' }>({
    visible: false,
    message: '',
    type: 'success'
  });

  const validarFormulario = () => {
    if (!nombre.trim()) {
      setToast({ visible: true, message: 'Ingresa el nombre', type: 'warning' });
      return false;
    }
    if (!apellido.trim()) {
      setToast({ visible: true, message: 'Ingresa el apellido', type: 'warning' });
      return false;
    }
    if (!email.trim() || !email.includes('@')) {
      setToast({ visible: true, message: 'Ingresa un correo válido', type: 'warning' });
      return false;
    }
    if (password.length < 6) {
      setToast({ visible: true, message: 'La contraseña debe tener al menos 6 caracteres', type: 'warning' });
      return false;
    }
    return true;
  };

  const handleCrear = async () => {
    if (!validarFormulario()) return;

    haptic.medium();
    setLoading(true);

    const result = await crearUsuario({
      nombre: nombre.trim(),
      apellido: apellido.trim(),
      email: email.trim().toLowerCase(),
      password,
      rol: 'padre',
    });

    if (result.success) {
      setToast({
        visible: true,
        message: 'Padre creado correctamente',
        type: 'success',
      });
      setTimeout(() => router.back(), 1500);
    } else {
      setToast({
        visible: true,
        message: result.error || 'Error al crear padre',
        type: 'error',
      });
    }
    setLoading(false);
  };

  return (
    <View className="flex-1 bg-padre-50">
      <StatusBar barStyle="light-content" backgroundColor="#7e22ce" />

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
            <Text className="text-white text-2xl font-bold">Nuevo Padre</Text>
            <Text className="text-white text-xl mt-1">
              Crear cuenta de representante
            </Text>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>
          <View className="bg-white rounded-2xl p-6 shadow-sm">

            {/* Nombre */}
            <View className="mb-4">
              <Text className="text-gray-700 font-semibold mb-2">Nombre</Text>
              <View className="flex-row items-center bg-gray-100 rounded-xl px-4">
                <User size={20} color="#6b7280" strokeWidth={2} />
                <TextInput
                  className="flex-1 py-4 px-3 text-gray-800"
                  placeholder="Nombre del representante"
                  placeholderTextColor="#9ca3af"
                  value={nombre}
                  onChangeText={setNombre}
                  autoCapitalize="words"
                />
              </View>
            </View>

            {/* Apellido */}
            <View className="mb-4">
              <Text className="text-gray-700 font-semibold mb-2">Apellido</Text>
              <View className="flex-row items-center bg-gray-100 rounded-xl px-4">
                <User size={20} color="#6b7280" strokeWidth={2} />
                <TextInput
                  className="flex-1 py-4 px-3 text-gray-800"
                  placeholder="Apellido del representante"
                  placeholderTextColor="#9ca3af"
                  value={apellido}
                  onChangeText={setApellido}
                  autoCapitalize="words"
                />
              </View>
            </View>

            {/* Email */}
            <View className="mb-4">
              <Text className="text-gray-700 font-semibold mb-2">Correo electrónico</Text>
              <View className="flex-row items-center bg-gray-100 rounded-xl px-4">
                <Mail size={20} color="#6b7280" strokeWidth={2} />
                <TextInput
                  className="flex-1 py-4 px-3 text-gray-800"
                  placeholder="padre@ejemplo.com"
                  placeholderTextColor="#9ca3af"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
              </View>
            </View>

            {/* Password */}
            <View className="mb-6">
              <Text className="text-gray-700 font-semibold mb-2">Contraseña</Text>
              <View className="flex-row items-center bg-gray-100 rounded-xl px-4">
                <Lock size={20} color="#6b7280" strokeWidth={2} />
                <TextInput
                  className="flex-1 py-4 px-3 text-gray-800"
                  placeholder="Contraseña temporal"
                  placeholderTextColor="#9ca3af"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  {showPassword ? (
                    <EyeOff size={20} color="#6b7280" strokeWidth={2} />
                  ) : (
                    <Eye size={20} color="#6b7280" strokeWidth={2} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Botón Crear */}
            <TouchableOpacity
              className={`py-4 rounded-xl flex-row items-center justify-center ${
                loading ? 'bg-padre-400' : 'bg-padre-600'
              }`}
              onPress={handleCrear}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <>
                  <Save size={20} color="#ffffff" strokeWidth={2.5} />
                  <Text className="text-white font-bold text-lg ml-2">Crear Padre</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <View className="bg-padre-100 rounded-xl p-4 mt-4 mb-6">
            <Text className="text-padre-800 text-sm text-center">
              El padre podrá ver información de sus estudiantes y marcar asistencia.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast((prev) => ({ ...prev, visible: false }))}
      />
    </View>
  );
}
