import * as Haptics from 'expo-haptics';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router';
import { Bus, Fingerprint, Lock, Mail } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { Toast } from '../components';
import { useAuth } from '../lib/contexts/AuthContext';

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

  // Estados para autenticación biométrica
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);
  const [hasSavedCredentials, setHasSavedCredentials] = useState(false);

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

    // Verificar soporte biométrico y credenciales guardadas
    checkBiometricSupport();
  }, []);

  /* =====================
     AUTENTICACIÓN BIOMÉTRICA
  ====================== */
  const checkBiometricSupport = async () => {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      setIsBiometricSupported(compatible && enrolled);

      // Verificar si hay credenciales guardadas
      const savedEmail = await SecureStore.getItemAsync('userEmail');
      setHasSavedCredentials(!!savedEmail);
    } catch (error) {
      console.error('Error verificando biometría:', error);
      setIsBiometricSupported(false);
    }
  };

  const handleBiometricAuth = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Autentícate para iniciar sesión',
        fallbackLabel: 'Usar contraseña',
        cancelLabel: 'Cancelar',
      });

      if (result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        // Recuperar credenciales guardadas
        const savedEmail = await SecureStore.getItemAsync('userEmail');
        const savedPassword = await SecureStore.getItemAsync('userPassword');

        if (savedEmail && savedPassword) {
          setEmail(savedEmail);
          setPassword(savedPassword);

          // Iniciar sesión automáticamente
          setIsLoading(true);
          const { error } = await signIn(savedEmail, savedPassword);

          if (error) {
            setIsLoading(false);
            showToast(getAuthErrorMessage(error), 'error');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          } else {
            showToast('Inicio de sesión exitoso', 'success');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
        } else {
          showToast('No hay credenciales guardadas', 'warning');
        }
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
    } catch (error) {
      console.error('Error en autenticación biométrica:', error);
      showToast('Error en autenticación biométrica', 'error');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

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
      showToast('Ingresa tu correo electrónico', 'warning');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
  
    if (!password) {
      showToast('Ingresa tu contraseña', 'warning');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
  
    // Validación de formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      showToast('Formato de correo inválido', 'warning');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
  
    setIsLoading(true);
  
    try {
      const { error } = await signIn(email, password);

      if (error) {
        console.error('❌ Error de login:', error);
        setIsLoading(false);
        showToast(`${getAuthErrorMessage(error)}`, 'error');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } else {
        // Login exitoso
        console.log('✅ Login exitoso - esperando carga de perfil...');
        showToast('Inicio de sesión exitoso', 'success');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        // Guardar credenciales para autenticación biométrica
        if (isBiometricSupported) {
          try {
            await SecureStore.setItemAsync('userEmail', email.trim().toLowerCase());
            await SecureStore.setItemAsync('userPassword', password);
            setHasSavedCredentials(true);
            console.log('✅ Credenciales guardadas para biometría');
          } catch (error) {
            console.error('❌ Error guardando credenciales:', error);
          }
        }

        // Delay de 800ms para que se vea el toast verde
        setTimeout(() => {
          // El useEffect de arriba manejará la redirección cuando profile esté listo
          console.log('⏳ Verificando perfil del usuario...');
        }, 800);
      }
    } catch (error) {
      console.error('❌ Error inesperado:', error);
      setIsLoading(false);
      showToast('Error inesperado. Intenta nuevamente', 'error');
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

          {/* Botón de Autenticación Biométrica */}
          {isBiometricSupported && hasSavedCredentials && !isLoading && (
            <TouchableOpacity
              className="py-4 rounded-xl bg-gray-100 border-2 border-primary-200 mt-3 flex-row items-center justify-center"
              onPress={handleBiometricAuth}
              activeOpacity={0.8}
            >
              <Fingerprint size={24} color="#2563eb" strokeWidth={2.5} />
              <Text className="text-primary-600 text-lg font-bold ml-2">
                Iniciar con Biometría
              </Text>
            </TouchableOpacity>
          )}

          {/* Mensajes informativos */}
          <View className="mt-6 space-y-2">
            <Text className="text-center text-gray-500 text-sm">
              Sistema de autenticación institucional
            </Text>

            <Text className="text-center text-gray-600 text-sm mt-3">
              ¿No tienes cuenta?{' '}
              <Text className="text-primary-600 font-semibold">
                Contacta a tu institución
              </Text>
            </Text>
          </View>
        </Animated.View>
      </View>
    </ScrollView>
  );
}