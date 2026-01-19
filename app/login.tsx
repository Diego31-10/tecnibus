import { View, Text, TextInput, StatusBar, ScrollView, TouchableOpacity } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Bus, Mail, Lock, User, UserCircle, Shield } from 'lucide-react-native';
import { Toast } from '../components';
import * as Haptics from 'expo-haptics';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<'parent' | 'driver' | 'admin' | null>(null);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Animaciones suaves
  const logoScale = useSharedValue(0.8);
  const logoOpacity = useSharedValue(0);
  const formTranslateY = useSharedValue(30);
  const formOpacity = useSharedValue(0);

  useEffect(() => {
    logoScale.value = withTiming(1, {
      duration: 600,
      easing: Easing.out(Easing.cubic),
    });
    logoOpacity.value = withTiming(1, {
      duration: 600,
      easing: Easing.out(Easing.cubic),
    });

    setTimeout(() => {
      formTranslateY.value = withTiming(0, {
        duration: 500,
        easing: Easing.out(Easing.cubic),
      });
      formOpacity.value = withTiming(1, {
        duration: 500,
        easing: Easing.out(Easing.cubic),
      });
    }, 200);
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
    opacity: logoOpacity.value,
  }));

  const formStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: formTranslateY.value }],
    opacity: formOpacity.value,
  }));

  const handleRoleSelect = (role: 'parent' | 'driver' | 'admin') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedRole(role);
  };

  const handleLogin = () => {
    if (!email || !password) {
      setToastMessage('⚠️ Por favor completa todos los campos');
      setToastVisible(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    if (!selectedRole) {
      setToastMessage('⚠️ Por favor selecciona un rol');
      setToastVisible(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    if (selectedRole === 'parent') {
      router.push('/parent');
    } else if (selectedRole === 'driver') {
      router.push('/driver');
    } else if (selectedRole === 'admin') {
      router.push('/admin');
    }
  };

  const getButtonColor = () => {
    if (!selectedRole) return 'bg-gray-300';
    if (selectedRole === 'parent') return 'bg-primary-600';
    if (selectedRole === 'driver') return 'bg-accent-500';
    return 'bg-admin-600';
  };

  return (
    <ScrollView className="flex-1 bg-primary-50">
      <StatusBar barStyle="dark-content" backgroundColor="#eff6ff" />

      <Toast
        visible={toastVisible}
        message={toastMessage}
        type="warning"
        onHide={() => setToastVisible(false)}
      />
      
      <View className="flex-1 px-6 pt-16 pb-8">
        {/* Header animado */}
        <Animated.View style={logoStyle} className="items-center mb-10">
          <View className="bg-primary-600 rounded-full p-5 mb-4">
            <Bus size={48} color="#ffffff" strokeWidth={2.5} />
          </View>
          <Text className="text-4xl font-bold text-primary-800">
            TecniBus
          </Text>
          <Text className="text-base text-gray-600 mt-2">
            Monitoreo de Transporte Escolar
          </Text>
        </Animated.View>

        {/* Formulario animado */}
        <Animated.View style={formStyle}>
          <View className="bg-white rounded-3xl p-6 shadow-lg mb-6">
            {/* Input de Email */}
            <View className="mb-4">
              <Text className="text-sm font-semibold text-gray-700 mb-2">
                Correo electrónico
              </Text>
              <View className="flex-row items-center bg-gray-50 rounded-xl px-4 py-3 border border-gray-200">
                <Mail size={20} color="#6b7280" />
                <TextInput
                  className="flex-1 ml-3 text-base text-gray-800"
                  placeholder="ejemplo@correo.com"
                  placeholderTextColor="#9ca3af"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* Input de Contraseña */}
            <View className="mb-4">
              <Text className="text-sm font-semibold text-gray-700 mb-2">
                Contraseña
              </Text>
              <View className="flex-row items-center bg-gray-50 rounded-xl px-4 py-3 border border-gray-200">
                <Lock size={20} color="#6b7280" />
                <TextInput
                  className="flex-1 ml-3 text-base text-gray-800"
                  placeholder="••••••••"
                  placeholderTextColor="#9ca3af"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>
            </View>

            {/* Selección de Rol */}
            <View className="mt-2">
              <Text className="text-sm font-semibold text-gray-700 mb-3">
                Selecciona tu rol
              </Text>
              
              {/* Primera fila: Padre y Chofer */}
              <View className="flex-row gap-3 mb-3">
                <TouchableOpacity
                  className={`flex-1 flex-row items-center justify-center py-4 rounded-xl border-2 ${
                    selectedRole === 'parent'
                      ? 'bg-primary-50 border-primary-600'
                      : 'bg-white border-gray-200'
                  }`}
                  onPress={() => handleRoleSelect('parent')}
                  activeOpacity={0.7}
                >
                  <User
                    size={22}
                    color={selectedRole === 'parent' ? '#2563eb' : '#6b7280'}
                    strokeWidth={2.5}
                  />
                  <Text
                    className={`ml-2 font-semibold ${
                      selectedRole === 'parent' ? 'text-primary-700' : 'text-gray-600'
                    }`}
                  >
                    Padre
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  className={`flex-1 flex-row items-center justify-center py-4 rounded-xl border-2 ${
                    selectedRole === 'driver'
                      ? 'bg-accent-50 border-accent-600'
                      : 'bg-white border-gray-200'
                  }`}
                  onPress={() => handleRoleSelect('driver')}
                  activeOpacity={0.7}
                >
                  <UserCircle
                    size={22}
                    color={selectedRole === 'driver' ? '#ca8a04' : '#6b7280'}
                    strokeWidth={2.5}
                  />
                  <Text
                    className={`ml-2 font-semibold ${
                      selectedRole === 'driver' ? 'text-accent-700' : 'text-gray-600'
                    }`}
                  >
                    Chofer
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Segunda fila: Administrador (completo) */}
              <TouchableOpacity
                className={`flex-row items-center justify-center py-4 rounded-xl border-2 ${
                  selectedRole === 'admin'
                    ? 'bg-admin-50 border-admin-600'
                    : 'bg-white border-gray-200'
                }`}
                onPress={() => handleRoleSelect('admin')}
                activeOpacity={0.7}
              >
                <Shield
                  size={22}
                  color={selectedRole === 'admin' ? '#16a34a' : '#6b7280'}
                  strokeWidth={2.5}
                />
                <Text
                  className={`ml-2 font-semibold ${
                    selectedRole === 'admin' ? 'text-admin-700' : 'text-gray-600'
                  }`}
                >
                  Administrador
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Botón de Login */}
          <TouchableOpacity
            className={`py-4 rounded-xl shadow-md ${getButtonColor()}`}
            onPress={handleLogin}
            disabled={!selectedRole}
            activeOpacity={0.8}
          >
            <Text className="text-white text-center text-lg font-bold">
              Iniciar Sesión
            </Text>
          </TouchableOpacity>

          <Text className="text-center text-gray-500 text-sm mt-6">
            Versión Alpha - Solo interfaz de usuario
          </Text>
        </Animated.View>
      </View>
    </ScrollView>
  );
}