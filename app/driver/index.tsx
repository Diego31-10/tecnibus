import { View, Text, TouchableOpacity, StatusBar, ScrollView, FlatList } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { 
  ArrowLeft, 
  MapPin, 
  Bus,
  Play,
  Square,
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  Navigation
} from 'lucide-react-native';

// Tipo para estudiante
type Student = {
  id: string;
  name: string;
  address: string;
  isAttending: boolean;
};

export default function DriverHomeScreen() {
  const router = useRouter();
  const [routeActive, setRouteActive] = useState(false);

  // Datos simulados del recorrido
  const routeName = "Ruta Centro - Norte";
  const routeTime = "07:00 AM";
  const totalStudents = 12;

  // Lista de estudiantes simulados
  const [students, setStudents] = useState<Student[]>([
    { id: '1', name: 'María Rodríguez', address: 'Av. Principal #123', isAttending: true },
    { id: '2', name: 'Juan Pérez', address: 'Calle 5 #45', isAttending: true },
    { id: '3', name: 'Ana García', address: 'Urbanización Los Pinos', isAttending: false },
    { id: '4', name: 'Carlos Mendoza', address: 'Sector El Valle #78', isAttending: true },
    { id: '5', name: 'Sofía Torres', address: 'Calle Luna #90', isAttending: true },
    { id: '6', name: 'Luis Morales', address: 'Av. Libertad #234', isAttending: true },
    { id: '7', name: 'Elena Castillo', address: 'Barrio Centro #56', isAttending: false },
    { id: '8', name: 'Diego Ramírez', address: 'Calle Sol #12', isAttending: true },
  ]);

  const attendingCount = students.filter(s => s.isAttending).length;

  const renderStudentItem = ({ item }: { item: Student }) => (
    <View className="bg-white rounded-xl p-4 mb-3 shadow-sm border border-gray-100">
      <View className="flex-row items-center justify-between">
        <View className="flex-1">
          <Text className="text-base font-bold text-gray-800 mb-1">
            {item.name}
          </Text>
          <View className="flex-row items-center">
            <MapPin size={14} color="#9ca3af" strokeWidth={2} />
            <Text className="text-sm text-gray-500 ml-1">
              {item.address}
            </Text>
          </View>
        </View>
        
        {/* Badge de estado */}
        {item.isAttending ? (
          <View className="bg-green-100 px-3 py-2 rounded-lg flex-row items-center">
            <CheckCircle2 size={18} color="#16a34a" strokeWidth={2.5} />
            <Text className="text-green-700 font-bold ml-1 text-xs">
              Asiste
            </Text>
          </View>
        ) : (
          <View className="bg-red-100 px-3 py-2 rounded-lg flex-row items-center">
            <XCircle size={18} color="#dc2626" strokeWidth={2.5} />
            <Text className="text-red-700 font-bold ml-1 text-xs">
              Ausente
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-accent-50">
      <StatusBar barStyle="light-content" backgroundColor="#854d0e" />
      
      {/* Header */}
      <View className="bg-accent-600 pt-12 pb-6 px-6 rounded-b-3xl shadow-lg">
        <View className="flex-row items-center justify-between mb-4">
          <TouchableOpacity 
            onPress={() => router.back()}
            className="bg-accent-700 p-2 rounded-xl"
          >
            <ArrowLeft size={24} color="#ffffff" strokeWidth={2.5} />
          </TouchableOpacity>
          
          <View className="bg-accent-700 p-2 rounded-xl">
            <Bus size={24} color="#ffffff" strokeWidth={2.5} />
          </View>
        </View>

        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="text-white text-2xl font-bold">
              {routeName}
            </Text>
            <View className="flex-row items-center mt-2">
              <Clock size={16} color="#fef3c7" strokeWidth={2} />
              <Text className="text-accent-100 text-sm ml-1">
                Hora de salida: {routeTime}
              </Text>
            </View>
          </View>
        </View>

        {/* Contador de estudiantes */}
        <View className="bg-accent-700 rounded-xl p-3 mt-4 flex-row items-center justify-between">
          <View className="flex-row items-center">
            <Users size={20} color="#fef3c7" strokeWidth={2.5} />
            <Text className="text-white font-bold ml-2">
              Estudiantes: {attendingCount}/{totalStudents}
            </Text>
          </View>
          {routeActive && (
            <View className="bg-green-500 px-3 py-1 rounded-full">
              <Text className="text-white text-xs font-bold">
                EN RUTA
              </Text>
            </View>
          )}
        </View>
      </View>

      <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>
        {/* Card del Mapa */}
        <View className="bg-white rounded-2xl p-5 mb-4 shadow-md">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-lg font-bold text-gray-800">
              Mapa de Recorrido
            </Text>
            <View className="bg-accent-100 p-2 rounded-full">
              <Navigation size={20} color="#ca8a04" strokeWidth={2.5} />
            </View>
          </View>

          {/* Placeholder del Mapa - Más grande */}
          <View className="bg-gray-100 rounded-xl h-64 items-center justify-center border-2 border-dashed border-gray-300">
            <MapPin size={56} color="#9ca3af" strokeWidth={2} />
            <Text className="text-gray-500 font-semibold mt-3 text-base">
              Vista de Mapa en Tiempo Real
            </Text>
            <Text className="text-gray-400 text-xs mt-1">
              Se implementará en fase funcional
            </Text>
            <View className="flex-row items-center mt-3">
              <View className="bg-green-500 w-3 h-3 rounded-full mr-2" />
              <Text className="text-gray-500 text-xs">
                Ubicación actual y ruta del recorrido
              </Text>
            </View>
          </View>
        </View>

        {/* Sección de Lista de Estudiantes */}
        <View className="bg-white rounded-2xl p-5 mb-4 shadow-md">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-bold text-gray-800">
              Lista de Estudiantes
            </Text>
            <View className="bg-accent-100 px-3 py-1 rounded-lg">
              <Text className="text-accent-700 font-bold text-sm">
                {attendingCount} asisten
              </Text>
            </View>
          </View>

          {/* Lista de estudiantes */}
          <View>
            {students.map((student) => (
              <View key={student.id}>
                {renderStudentItem({ item: student })}
              </View>
            ))}
          </View>
        </View>

        {/* Botones de Control */}
        <View className="mb-6">
          {!routeActive ? (
            <TouchableOpacity 
              className="bg-green-600 py-4 rounded-xl shadow-md flex-row items-center justify-center"
              onPress={() => setRouteActive(true)}
            >
              <Play size={24} color="#ffffff" strokeWidth={2.5} fill="#ffffff" />
              <Text className="text-white text-center text-lg font-bold ml-2">
                Iniciar Recorrido
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              className="bg-red-600 py-4 rounded-xl shadow-md flex-row items-center justify-center"
              onPress={() => setRouteActive(false)}
            >
              <Square size={24} color="#ffffff" strokeWidth={2.5} fill="#ffffff" />
              <Text className="text-white text-center text-lg font-bold ml-2">
                Finalizar Recorrido
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Nota informativa */}
        <View className="bg-accent-100 rounded-xl p-4 mb-6">
          <Text className="text-accent-800 text-sm text-center font-semibold">
            💡 Los estudiantes marcados como "Ausente" han sido notificados por sus padres
          </Text>
        </View>

        {/* Espacio inferior */}
        <View className="h-4" />
      </ScrollView>
    </View>
  );
}