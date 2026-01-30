import { Stack } from 'expo-router';
import { Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthGuard } from '../components/AuthGuard';
import { AuthProvider } from '../contexts/AuthContext';
import "../global.css";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AuthGuard>
          <Stack
            screenOptions={{
              headerShown: false,
              animation: Platform.OS === 'ios' ? 'default' : 'slide_from_right',
              animationDuration: 250,
            }}
          >
            <Stack.Screen name="index" options={{ animation: 'none' }} />
            <Stack.Screen name="login" options={{ animation: 'fade', animationDuration: 200 }} />
            <Stack.Screen name="parent/index" options={{ animation: 'fade', animationDuration: 200 }} />
            <Stack.Screen name="driver/index" options={{ animation: 'fade', animationDuration: 200 }} />
            <Stack.Screen name="admin/index" options={{ animation: 'fade', animationDuration: 200 }} />
            <Stack.Screen name="admin/choferes/index" options={{ animation: 'fade', animationDuration: 200 }}/>
            <Stack.Screen name="admin/choferes/crear" options={{ animation: 'fade', animationDuration: 200 }}/>
            <Stack.Screen name="admin/padres/index" options={{ animation: 'fade', animationDuration: 200 }}/>
            <Stack.Screen name="admin/padres/crear" options={{ animation: 'fade', animationDuration: 200 }}/>
            <Stack.Screen name="admin/estudiantes/index" options={{ animation: 'fade', animationDuration: 200 }}/>
            <Stack.Screen name="admin/estudiantes/crear" options={{ animation: 'fade', animationDuration: 200 }}/>
            <Stack.Screen name="parent/perfil" options={{ animation: 'fade', animationDuration: 200 }}/>
            <Stack.Screen name="driver/perfil" options={{ animation: 'fade', animationDuration: 200 }}/>
            <Stack.Screen name="admin/perfil" options={{ animation: 'fade', animationDuration: 200 }}/>  
          </Stack>
        </AuthGuard>
      </AuthProvider>
    </SafeAreaProvider>
  );
}