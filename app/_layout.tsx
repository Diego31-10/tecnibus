import { Stack } from 'expo-router';
import { AuthProvider } from '../lib/AuthContext';
import { AuthGuard } from '../components/AuthGuard';
import "../global.css";

export default function RootLayout() {
  return (
    <AuthProvider>
      <AuthGuard>
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'fade',
          }}
        >
          <Stack.Screen name="index" options={{ animation: 'none' }} />
          <Stack.Screen name="login" />
          <Stack.Screen name="parent/index" />
          <Stack.Screen name="driver/index" />
          <Stack.Screen name="admin/index" />
          <Stack.Screen name="admin/choferes/crear" />
          <Stack.Screen name="admin/padres/crear" />
        </Stack>
      </AuthGuard>
    </AuthProvider>
  );
}