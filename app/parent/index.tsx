import { View, Text } from 'react-native';
import { User } from 'lucide-react-native';

export default function ParentHomeScreen() {
  return (
    <View className="flex-1 bg-primary-50 items-center justify-center">
      <User size={64} color="#2563eb" strokeWidth={2} />
      <Text className="text-2xl font-bold text-primary-800 mt-4">
        Pantalla del Padre
      </Text>
      <Text className="text-gray-600 mt-2">
        Se desarrollará en la FASE 2
      </Text>
    </View>
  );
}