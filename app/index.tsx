import { View, Text, TextInput, TouchableOpacity, StatusBar, ScrollView } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Bus, Mail, Lock, User, UserCircle } from 'lucide-react-native';
import "@/global.css"

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<'parent' | 'driver' | null>(null);

  const handleLogin = () => {
    // Simulación de navegación según el rol seleccionado
    if (selectedRole === 'parent') {
      router.push('/parent');
    } else if (selectedRole === 'driver') {
      router.push('/driver');
    }
  };

  return (
    <ScrollView className="flex-1 bg-gradient-to-b from-primary-50 to-white">
      <StatusBar barStyle="dark-content" backgroundColor="#eff6ff" />
      
      <View className="flex-1 px-6 pt-20 pb-8">
        {/* Header con logo */}
        <View className="items-center mb-12">
          <View className="bg-primary-600 rounded-full p-5 mb-4">
            <Bus size={48} color="#ffffff" strokeWidth={2.5} />
          </View>
          <Text className="text-4xl font-bold text-primary-800">
            TecniBus
          </Text>
          <Text className="text-base text-gray-600 mt-2">
            Monitoreo de Transporte Escolar
          </Text>
        </View>

        {/* Formulario */}
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
            
            <View className="flex-row gap-3">
              {/* Botón Padre */}
              <TouchableOpacity
                className={`flex-1 flex-row items-center justify-center py-4 rounded-xl border-2 ${
                  selectedRole === 'parent'
                    ? 'bg-primary-50 border-primary-600'
                    : 'bg-white border-gray-200'
                }`}
                onPress={() => setSelectedRole('parent')}
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

              {/* Botón Chofer */}
              <TouchableOpacity
                className={`flex-1 flex-row items-center justify-center py-4 rounded-xl border-2 ${
                  selectedRole === 'driver'
                    ? 'bg-accent-50 border-accent-600'
                    : 'bg-white border-gray-200'
                }`}
                onPress={() => setSelectedRole('driver')}
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
          </View>
        </View>

        {/* Botón de Iniciar Sesión */}
        <TouchableOpacity
          className={`py-4 rounded-xl ${
            selectedRole
              ? selectedRole === 'parent'
                ? 'bg-primary-600'
                : 'bg-accent-500'
              : 'bg-gray-300'
          }`}
          onPress={handleLogin}
          disabled={!selectedRole}
        >
          <Text className="text-white text-center text-lg font-bold">
            Iniciar Sesión
          </Text>
        </TouchableOpacity>

        {/* Texto de ayuda */}
        <Text className="text-center text-gray-500 text-sm mt-6">
          Versión Alpha - Solo interfaz de usuario
        </Text>
      </View>
    </ScrollView>
  );
}