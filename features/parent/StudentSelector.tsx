import { Colors } from "@/lib/constants/colors";
import { EstudianteDelPadre } from "@/lib/services/padres.service";
import { CheckCircle2, GraduationCap } from "lucide-react-native";
import { FlatList, Modal, Text, TouchableOpacity, View } from "react-native";

interface StudentSelectorProps {
  visible: boolean;
  estudiantes: EstudianteDelPadre[];
  selectedId?: string;
  onSelect: (estudiante: EstudianteDelPadre) => void;
  onClose: () => void;
}

export function StudentSelector({
  visible,
  estudiantes,
  selectedId,
  onSelect,
  onClose,
}: StudentSelectorProps) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-white rounded-t-3xl" style={{ maxHeight: "60%" }}>
          <View className="p-6 border-b border-gray-200">
            <Text className="text-xl font-bold text-gray-800 font-calsans">
              Seleccionar Estudiante
            </Text>
            <Text className="text-gray-500 text-sm mt-1">
              Tienes {estudiantes.length} estudiante(s) asignado(s)
            </Text>
          </View>

          <FlatList
            data={estudiantes}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => onSelect(item)}
                className="px-6 py-4 border-b border-gray-100"
                activeOpacity={0.7}
              >
                <View className="flex-row items-center">
                  <View
                    className="items-center justify-center"
                    style={{
                      backgroundColor: Colors.padre[100],
                      padding: 12,
                      borderRadius: 999,
                      marginRight: 12,
                    }}
                  >
                    <GraduationCap
                      size={24}
                      color={Colors.padre[600]}
                      strokeWidth={2}
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-gray-800 font-semibold text-base">
                      {item.nombreCompleto}
                    </Text>
                    <Text className="text-gray-500 text-sm mt-1">
                      {item.parada?.ruta?.nombre || "Sin ruta asignada"}
                    </Text>
                  </View>
                  {selectedId === item.id && (
                    <View
                      style={{
                        backgroundColor: Colors.padre[600],
                        padding: 4,
                        borderRadius: 999,
                      }}
                    >
                      <CheckCircle2
                        size={20}
                        color="#ffffff"
                        strokeWidth={2.5}
                      />
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            )}
          />

          <View className="p-4 border-t border-gray-200">
            <TouchableOpacity
              onPress={onClose}
              className="bg-gray-100 py-3 rounded-xl"
              activeOpacity={0.7}
            >
              <Text className="text-gray-700 font-semibold text-center">
                Cancelar
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
