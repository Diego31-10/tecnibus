import { View, Text } from 'react-native';
import { Bus } from 'lucide-react-native';

export default function DriverHomeScreen() {
  return (
    <View className="flex-1 bg-accent-50 items-center justify-center">
      <Bus size={64} color="#ca8a04" strokeWidth={2} />
      <Text className="text-2xl font-bold text-accent-700 mt-4">
        Pantalla del Chofer
      </Text>
      <Text className="text-gray-600 mt-2">
        Se desarrollará en la FASE 3
      </Text>
    </View>
  );
}