import {
  View,
  Text,
  TextInput,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Bus, Mail, Lock } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { Toast } from '../components';
import { useAuth } from '../lib/AuthContext';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn, user, profile, loading: authLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showRedirecting, setShowRedirecting] = useState(false);

  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] =
    useState<'success' | 'error' | 'warning'>('warning');

  /* =====================
     ANIMACIONES
  ====================== */
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

  /* =====================
   REDIRECCIÓN AUTOMÁTICA
====================== */
useEffect(() => {
  if (user && profile && !authLoading) {
    console.log('✅ Usuario autenticado, redirigiendo a:', profile.rol);
    
    // Esperar 2 segundos para que se vea el toast verde en la pantalla de login
    setTimeout(() => {
      setShowRedirecting(true); // Mostrar pantalla "Redirigiendo..."
      
      // Luego esperar 1.5 segundos más antes de navegar
      setTimeout(() => {
        const routes = {
          admin: '/admin',
          padre: '/parent',
          chofer: '/driver',
        };
        
        const route = routes[profile.rol as keyof typeof routes];
        if (route) {
          router.replace(route as any);
        }
      }, 800);
    }, 1300); // 2 segundos para ver el toast verde
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

  /* =====================
     TOAST
  ====================== */
  const showToast = (
    message: string,
    type: 'success' | 'error' | 'warning'
  ) => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  /* =====================
     ERRORES PERSONALIZADOS
  ====================== */
  const AUTH_ERROR_MAP: {
    test: (msg: string) => boolean;
    text: string;
  }[] = [
    {
      test: msg => msg.includes('invalid login credentials'),
      text: 'Correo o contraseña incorrectos',
    },
    {
      test: msg => msg.includes('invalid email'),
      text: 'El correo no tiene un formato válido',
    },
    {
      test: msg => msg.includes('email not confirmed'),
      text: 'Debes confirmar tu correo electrónico',
    },
    {
      test: msg => msg.includes('too many requests'),
      text: 'Demasiados intentos. Intenta más tarde',
    },
    {
      test: msg => msg.includes('network'),
      text: 'Error de conexión. Revisa tu internet',
    },
  ];

  const getAuthErrorMessage = (error: Error): string => {
    const message = error.message.toLowerCase();

    for (const rule of AUTH_ERROR_MAP) {
      if (rule.test(message)) {
        return rule.text;
      }
    }

    return 'No se pudo iniciar sesión. Intenta nuevamente';
  };

  /* =====================
     LOGIN
  ====================== */
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
        setIsLoading(false);
        showToast(`❌ ${getAuthErrorMessage(error)}`, 'error');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } else {
        // Login exitoso
        console.log('✅ Login exitoso - esperando carga de perfil...');
        showToast('✅ Inicio de sesión exitoso', 'success');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        
        // Delay de 800ms para que se vea el toast verde
        setTimeout(() => {
          // El useEffect de arriba manejará la redirección cuando profile esté listo
          console.log('⏳ Verificando perfil del usuario...');
        }, 800);
      }
    } catch (error) {
      console.error('❌ Error inesperado:', error);
      setIsLoading(false);
      showToast('❌ Error inesperado. Intenta nuevamente', 'error');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  /* =====================
   LOADING SCREEN
====================== */
if (showRedirecting) { // ← CAMBIO AQUÍ
  return (
    <View className="flex-1 bg-primary-600 items-center justify-center">
      <ActivityIndicator size="large" color="#ffffff" />
      <Text className="text-white mt-4 text-base">
        Redirigiendo...
      </Text>
    </View>
  );
}

  /* =====================
     UI
  ====================== */
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
        {/* Header */}
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

        {/* Form */}
        <Animated.View style={formStyle}>
          <View className="bg-white rounded-3xl p-6 shadow-lg mb-6">
            {/* Email */}
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

            {/* Password */}
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
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                  editable={!isLoading}
                  onSubmitEditing={handleLogin}
                />
              </View>
            </View>
          </View>

          {/* Button */}
          <TouchableOpacity
            className={`py-4 rounded-xl ${
              isLoading ? 'bg-gray-300' : 'bg-primary-600'
            }`}
            onPress={handleLogin}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <View className="flex-row items-center justify-center">
                <ActivityIndicator size="small" color="#ffffff" />
                <Text className="text-white text-lg font-bold ml-2">
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