import { View, Text, StatusBar } from 'react-native';
import { Bus } from 'lucide-react-native';
import "../global.css"

export default function TestScreen() {
  return (
    <View className="flex-1 bg-primary-50 items-center justify-center">
      <StatusBar barStyle="dark-content" />
      
      {/* Ícono de bus */}
      <Bus size={64} color="#2563eb" strokeWidth={2} />
      
      {/* Título */}
      <Text className="text-4xl font-bold text-primary-700 mt-6">
        TecniBus
      </Text>
      
      {/* Subtítulo */}
      <Text className="text-lg text-gray-600 mt-2">
        Sistema de Monitoreo Escolar
      </Text>
      
      {/* Card de prueba */}
      <View className="bg-white rounded-2xl p-6 mt-8 mx-6 shadow-lg">
        <Text className="text-center text-primary-600 font-semibold text-base">
          ✅ NativeWind configurado correctamente
        </Text>
        <Text className="text-center text-gray-500 mt-2">
          Listo para comenzar el desarrollo
        </Text>
      </View>
    </View>
  );
}