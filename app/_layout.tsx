import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { AuthGuard } from '../components/AuthGuard';
import "../global.css";
import { AuthProvider } from '../lib/contexts/AuthContext';
import { Platform } from 'react-native';

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
            <Stack.Screen name="admin/choferes/index" />
            <Stack.Screen name="admin/choferes/crear" />
            <Stack.Screen name="admin/padres/index" />
            <Stack.Screen name="admin/padres/crear" />
          </Stack>
        </AuthGuard>
      </AuthProvider>
    </SafeAreaProvider>
  );
}