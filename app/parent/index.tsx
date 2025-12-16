import { View, Text, TouchableOpacity, StatusBar, ScrollView, Image } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { 
  ArrowLeft, 
  User, 
  CheckCircle2, 
  XCircle, 
  MapPin, 
  Clock, 
  Info,
  Bus
} from 'lucide-react-native';

export default function ParentHomeScreen() {
  const router = useRouter();
  const [isAttending, setIsAttending] = useState(true);

  // Datos simulados
  const studentName = "María Rodríguez";
  const route = "Ruta Centro - Norte";
  const estimatedTime = "15 minutos";
  const busStatus = "En camino";

  return (
    <View className="flex-1 bg-primary-50">
      <StatusBar barStyle="light-content" backgroundColor="#1e40af" />
      
      {/* Header */}
      <View className="bg-primary-700 pt-12 pb-6 px-6 rounded-b-3xl shadow-lg">
        <View className="flex-row items-center justify-between mb-4">
          <TouchableOpacity 
            onPress={() => router.back()}
            className="bg-primary-600 p-2 rounded-xl"
          >
            <ArrowLeft size={24} color="#ffffff" strokeWidth={2.5} />
          </TouchableOpacity>
          
          <View className="bg-primary-600 p-2 rounded-xl">
            <User size={24} color="#ffffff" strokeWidth={2.5} />
          </View>
        </View>

        <View className="flex-row items-center">
          <View className="bg-primary-600 p-3 rounded-full mr-4">
            <User size={28} color="#ffffff" strokeWidth={2.5} />
          </View>
          <View className="flex-1">
            <Text className="text-white text-2xl font-bold">
              {studentName}
            </Text>
            <Text className="text-primary-200 text-sm mt-1">
              {route}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>
        {/* Card de Estado del Estudiante */}
        <View className="bg-white rounded-2xl p-5 mb-4 shadow-md">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-bold text-gray-800">
              Estado de Asistencia
            </Text>
            {isAttending ? (
              <View className="bg-green-100 px-3 py-1 rounded-full flex-row items-center">
                <CheckCircle2 size={16} color="#16a34a" strokeWidth={2.5} />
                <Text className="text-green-700 font-semibold ml-1 text-xs">
                  Asiste
                </Text>
              </View>
            ) : (
              <View className="bg-red-100 px-3 py-1 rounded-full flex-row items-center">
                <XCircle size={16} color="#dc2626" strokeWidth={2.5} />
                <Text className="text-red-700 font-semibold ml-1 text-xs">
                  No asistirá
                </Text>
              </View>
            )}
          </View>

          <Text className="text-gray-600 text-sm mb-4">
            {isAttending 
              ? 'El estudiante asistirá hoy y será recogido en el punto habitual.'
              : 'Has marcado que el estudiante no asistirá hoy. El chofer ha sido notificado.'
            }
          </Text>

          <TouchableOpacity
            className={`py-3 rounded-xl flex-row items-center justify-center ${
              isAttending ? 'bg-red-500' : 'bg-green-500'
            }`}
            onPress={() => setIsAttending(!isAttending)}
          >
            {isAttending ? (
              <XCircle size={20} color="#ffffff" strokeWidth={2.5} />
            ) : (
              <CheckCircle2 size={20} color="#ffffff" strokeWidth={2.5} />
            )}
            <Text className="text-white font-bold ml-2">
              {isAttending ? 'Marcar como ausente' : 'Marcar como presente'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Card de Ubicación */}
        <View className="bg-white rounded-2xl p-5 mb-4 shadow-md">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-lg font-bold text-gray-800">
              Ubicación de la Buseta
            </Text>
            <View className="bg-primary-100 p-2 rounded-full">
              <Bus size={20} color="#2563eb" strokeWidth={2.5} />
            </View>
          </View>

          {/* Placeholder del Mapa */}
          <View className="bg-gray-100 rounded-xl h-48 mb-4 items-center justify-center border-2 border-dashed border-gray-300">
            <MapPin size={48} color="#9ca3af" strokeWidth={2} />
            <Text className="text-gray-500 font-semibold mt-2">
              Mapa en tiempo real
            </Text>
            <Text className="text-gray-400 text-xs mt-1">
              Se implementará en fase funcional
            </Text>
          </View>

          {/* Estado del Bus */}
          <View className="bg-primary-50 rounded-xl p-4 flex-row items-center">
            <View className="bg-primary-600 p-2 rounded-full">
              <Bus size={24} color="#ffffff" strokeWidth={2.5} />
            </View>
            <View className="flex-1 ml-3">
              <Text className="text-primary-800 font-bold text-base">
                {busStatus}
              </Text>
              <Text className="text-primary-600 text-sm">
                La buseta está en ruta hacia tu ubicación
              </Text>
            </View>
          </View>
        </View>

        {/* Card de ETA (Tiempo Estimado) */}
        <View className="bg-white rounded-2xl p-5 mb-4 shadow-md">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-lg font-bold text-gray-800">
              Tiempo Estimado de Llegada
            </Text>
            <View className="bg-accent-100 p-2 rounded-full">
              <Clock size={20} color="#ca8a04" strokeWidth={2.5} />
            </View>
          </View>

          <View className="bg-gradient-to-r from-accent-50 to-accent-100 rounded-xl p-6 items-center">
            <Text className="text-accent-800 text-5xl font-bold">
              {estimatedTime}
            </Text>
            <Text className="text-accent-700 text-sm mt-2 font-semibold">
              Tiempo aproximado
            </Text>
          </View>

          <View className="mt-4 bg-gray-50 rounded-xl p-3 flex-row items-start">
            <Info size={18} color="#6b7280" strokeWidth={2} />
            <Text className="text-gray-600 text-xs ml-2 flex-1">
              El tiempo es estimado y puede variar según el tráfico y las condiciones del recorrido.
            </Text>
          </View>
        </View>

        {/* Botón Ver Más Detalles */}
        <TouchableOpacity 
          className="bg-primary-600 py-4 rounded-xl mb-6 shadow-md"
          onPress={() => {/* Acción futura */}}
        >
          <Text className="text-white text-center text-base font-bold">
            Ver Más Detalles del Recorrido
          </Text>
        </TouchableOpacity>

        {/* Espacio inferior */}
        <View className="h-4" />
      </ScrollView>
    </View>
  );
}