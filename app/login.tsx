import { View, Text, TextInput, StatusBar, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Bus, Mail, Lock } from 'lucide-react-native';
import { Toast } from '../components';
import { useAuth } from '../lib/AuthContext';
import * as Haptics from 'expo-haptics';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn, user, profile, loading: authLoading } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'warning'>('warning');
  const [isLoading, setIsLoading] = useState(false);

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

  // Redirigir automáticamente si ya está autenticado
  useEffect(() => {
    if (user && profile && !authLoading) {
      console.log('✅ Usuario ya autenticado, redirigiendo...');
      redirectToRolePage(profile.rol);
    }
  }, [user, profile, authLoading]);

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
    opacity: logoOpacity.value,
  }));

  const formStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: formTranslateY.value }],
    opacity: formOpacity.value,
  }));

  const showToast = (message: string, type: 'success' | 'error' | 'warning' = 'warning') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  const getErrorMessage = (error: Error): string => {
    const message = error.message.toLowerCase();
    
    if (message.includes('invalid login credentials')) {
      return 'Correo o contraseña incorrectos';
    }
    if (message.includes('email not confirmed')) {
      return 'Correo no confirmado. Verifica tu email';
    }
    if (message.includes('invalid email')) {
      return 'Formato de correo inválido';
    }
    if (message.includes('network')) {
      return 'Error de conexión. Verifica tu internet';
    }
    
    return 'Error al iniciar sesión. Intenta nuevamente';
  };

  const redirectToRolePage = (rol: string) => {
    const routes = {
      admin: '/admin',
      padre: '/parent',
      chofer: '/driver',
    };

    const route = routes[rol as keyof typeof routes];
    if (route) {
      console.log(`🔀 Redirigiendo a: ${route}`);
      router.replace(route as any);
    }
  };

  const handleLogin = async () => {
    // Validaciones básicas
    if (!email.trim()) {
      showToast('⚠️ Ingresa tu correo electrónico', 'warning');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    if (!password) {
      showToast('⚠️ Ingresa tu contraseña', 'warning');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    // Validación de formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      showToast('⚠️ Formato de correo inválido', 'warning');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await signIn(email, password);

      if (error) {
        console.error('❌ Error de login:', error);
        showToast(`❌ ${getErrorMessage(error)}`, 'error');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setIsLoading(false);
      } else {
        showToast('✅ Inicio de sesión exitoso', 'success');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        
        console.log('✅ Login exitoso - esperando carga de perfil...');
        
        setTimeout(() => {
          setIsLoading(false);
        }, 2000);
      }
    } catch (error) {
      console.error('❌ Error inesperado:', error);
      showToast('❌ Error inesperado. Intenta nuevamente', 'error');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setIsLoading(false);
    }
  };

  // Si ya está autenticado, mostrar loading
  if (user && profile && !authLoading) {
    return (
      <View className="flex-1 bg-primary-600 items-center justify-center">
        <ActivityIndicator size="large" color="#ffffff" />
        <Text className="text-white mt-4 text-base">
          Redirigiendo...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-primary-50">
      <StatusBar barStyle="dark-content" backgroundColor="#eff6ff" />

      <Toast
        visible={toastVisible}
        message={toastMessage}
        type={toastType}
        onHide={() => setToastVisible(false)}
      />
      
      <View className="flex-1 px-6 pt-20 pb-8">
        {/* Header animado */}
        <Animated.View style={logoStyle} className="items-center mb-12">
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
                  editable={!isLoading}
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
                  editable={!isLoading}
                  onSubmitEditing={handleLogin}
                />
              </View>
            </View>
          </View>

          {/* Botón de Login */}
          <TouchableOpacity
            className={`py-4 rounded-xl shadow-md ${isLoading ? 'bg-gray-300' : 'bg-primary-600'}`}
            onPress={handleLogin}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <View className="flex-row items-center justify-center">
                <ActivityIndicator size="small" color="#ffffff" />
                <Text className="text-white text-center text-lg font-bold ml-2">
                  Iniciando sesión...
                </Text>
              </View>
            ) : (
              <Text className="text-white text-center text-lg font-bold">
                Iniciar Sesión
              </Text>
            )}
          </TouchableOpacity>

          <Text className="text-center text-gray-500 text-sm mt-6">
            Sistema de autenticación institucional
          </Text>
        </Animated.View>
      </View>
    </ScrollView>
  );
}