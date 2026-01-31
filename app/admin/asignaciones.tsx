import { Colors } from '@/lib/constants/colors';
import { haptic } from '@/lib/utils/haptics';
import { createShadow } from '@/lib/utils/shadows';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Bus,
  Calendar,
  CheckCircle2,
  Clock,
  Navigation,
  Plus,
  RefreshCw,
  Settings,
  Trash2,
  UserCircle,
  XCircle
} from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedCard } from '../../components';
import {
  createAsignacion,
  deleteAsignacion,
  getAsignacionesChofer,
  type AsignacionRuta,
  type CreateAsignacionDto
} from '@/lib/services/asignaciones.service';
import { supabase } from '@/lib/services/supabase';

type Chofer = {
  id: string;
  nombre: string;
  apellido: string;
  id_buseta: string | null;
  buseta_placa?: string;
};

type Ruta = {
  id: string;
  nombre: string;
  estado: string | null;
};

type Buseta = {
  id: string;
  placa: string;
  ocupada: boolean;
  chofer_nombre?: string;
};

const DIAS_SEMANA = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];

export default function AsignacionesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const paddingTop = Math.max(insets.top + 8, 48);
  const shadow = createShadow('lg');

  const [loading, setLoading] = useState(true);
  const [choferes, setChoferes] = useState<Chofer[]>([]);
  const [rutas, setRutas] = useState<Ruta[]>([]);
  const [busetas, setBusetas] = useState<Buseta[]>([]);
  const [asignaciones, setAsignaciones] = useState<AsignacionRuta[]>([]);
  const [choferSeleccionado, setChoferSeleccionado] = useState<Chofer | null>(null);
  const [busetaFilter, setBusetaFilter] = useState('');

  // Modal crear asignación
  const [modalVisible, setModalVisible] = useState(false);
  const [modalBusetaVisible, setModalBusetaVisible] = useState(false);
  const [formData, setFormData] = useState<CreateAsignacionDto>({
    id_chofer: '',
    id_ruta: '',
    hora_inicio: '06:00:00',
    hora_fin: '07:00:00',
    descripcion: '',
    dias_semana: ['lunes', 'martes', 'miércoles', 'jueves', 'viernes'],
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);

      // Cargar choferes con busetas
      const { data: choferesData, error: errorChoferes } = await supabase
        .from('choferes')
        .select(`
          id,
          id_buseta,
          profiles!inner(
            nombre,
            apellido
          ),
          busetas(
            placa
          )
        `);

      if (errorChoferes) throw errorChoferes;

      const choferesFormateados: Chofer[] = (choferesData || []).map((c: any) => ({
        id: c.id,
        nombre: c.profiles.nombre,
        apellido: c.profiles.apellido,
        id_buseta: c.id_buseta,
        buseta_placa: c.busetas?.placa || null,
      }));

      setChoferes(choferesFormateados);

      // Cargar rutas
      const { data: rutasData, error: errorRutas } = await supabase
        .from('rutas')
        .select('id, nombre, estado')
        .eq('estado', 'activa')
        .order('nombre');

      if (errorRutas) throw errorRutas;
      setRutas(rutasData || []);

      // Cargar busetas con info de ocupación
      const { data: busetasData, error: errorBusetas } = await supabase
        .from('busetas')
        .select('id, placa')
        .order('placa');

      if (errorBusetas) throw errorBusetas;

      // Marcar busetas ocupadas
      const busetasConEstado: Buseta[] = (busetasData || []).map((buseta) => {
        const choferConBuseta = choferesFormateados.find(c => c.id_buseta === buseta.id);
        return {
          id: buseta.id,
          placa: buseta.placa,
          ocupada: !!choferConBuseta,
          chofer_nombre: choferConBuseta
            ? `${choferConBuseta.nombre} ${choferConBuseta.apellido}`
            : undefined,
        };
      });

      setBusetas(busetasConEstado);
    } catch (error) {
      console.error('Error cargando datos:', error);
      Alert.alert('Error', 'No se pudieron cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const cargarAsignacionesChofer = async (idChofer: string) => {
    try {
      const data = await getAsignacionesChofer(idChofer);
      setAsignaciones(data);
    } catch (error) {
      console.error('Error cargando asignaciones:', error);
    }
  };

  const handleSeleccionarChofer = (chofer: Chofer) => {
    haptic.light();
    setChoferSeleccionado(chofer);
    cargarAsignacionesChofer(chofer.id);
  };

  const handleAbrirModalAsignacion = () => {
    if (!choferSeleccionado) {
      Alert.alert('Atención', 'Selecciona un chofer primero');
      return;
    }
    setFormData({
      id_chofer: choferSeleccionado.id,
      id_ruta: rutas[0]?.id || '',
      hora_inicio: '06:00:00',
      hora_fin: '07:00:00',
      descripcion: '',
      dias_semana: undefined, // NULL = todos los días
    });
    setModalVisible(true);
  };

  const handleCrearAsignacion = async () => {
    try {
      if (!formData.id_ruta) {
        Alert.alert('Error', 'Selecciona una ruta');
        return;
      }

      haptic.medium();
      const result = await createAsignacion(formData);

      if (result) {
        haptic.success();
        Alert.alert('Éxito', 'Recorrido asignado correctamente');
        setModalVisible(false);
        if (choferSeleccionado) {
          cargarAsignacionesChofer(choferSeleccionado.id);
        }
      } else {
        haptic.error();
        Alert.alert('Error', 'No se pudo crear la asignación');
      }
    } catch (error) {
      console.error('Error creando asignación:', error);
      haptic.error();
      Alert.alert('Error', 'Ocurrió un error al crear la asignación');
    }
  };

  const handleEliminarAsignacion = (id: string) => {
    Alert.alert(
      'Confirmar eliminación',
      '¿Estás seguro de eliminar este recorrido?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            haptic.medium();
            const success = await deleteAsignacion(id);
            if (success) {
              haptic.success();
              if (choferSeleccionado) {
                cargarAsignacionesChofer(choferSeleccionado.id);
              }
            } else {
              haptic.error();
              Alert.alert('Error', 'No se pudo eliminar el recorrido');
            }
          },
        },
      ]
    );
  };

  const handleAsignarBuseta = async (idChofer: string, idBuseta: string) => {
    try {
      haptic.medium();
      const { error } = await supabase
        .from('choferes')
        .update({ id_buseta: idBuseta })
        .eq('id', idChofer);

      if (error) throw error;

      haptic.success();
      Alert.alert('Éxito', 'Buseta asignada correctamente');
      setModalBusetaVisible(false);
      cargarDatos();
    } catch (error) {
      console.error('Error asignando buseta:', error);
      haptic.error();
      Alert.alert('Error', 'No se pudo asignar la buseta');
    }
  };

  const toggleTodosDias = () => {
    if (formData.dias_semana === undefined) {
      // Cambiar a modo días específicos (iniciar con vacío)
      setFormData({ ...formData, dias_semana: [] });
    } else {
      // Cambiar a modo "todos los días"
      setFormData({ ...formData, dias_semana: undefined });
    }
  };

  const toggleDia = (dia: string) => {
    // Si está en modo "todos los días", no hacer nada
    if (formData.dias_semana === undefined) return;

    const dias = formData.dias_semana;
    if (dias.includes(dia)) {
      const newDias = dias.filter((d) => d !== dia);
      setFormData({
        ...formData,
        dias_semana: newDias.length === 0 ? undefined : newDias,
      });
    } else {
      setFormData({
        ...formData,
        dias_semana: [...dias, dia],
      });
    }
  };

  return (
    <View className="flex-1 bg-admin-50">
      <StatusBar barStyle="light-content" backgroundColor={Colors.admin[700]} />

      {/* Header */}
      <View className="bg-admin-700 pb-6 px-6 rounded-b-3xl" style={[{ paddingTop }, shadow]}>
        <View className="flex-row items-center justify-between mb-4">
          <TouchableOpacity
            onPress={() => router.back()}
            className="bg-admin-600 p-2 rounded-xl"
          >
            <ArrowLeft size={24} color="#ffffff" strokeWidth={2.5} />
          </TouchableOpacity>

          <TouchableOpacity onPress={cargarDatos} className="bg-admin-600 p-2 rounded-xl">
            <RefreshCw size={24} color="#ffffff" strokeWidth={2.5} />
          </TouchableOpacity>
        </View>

        <View className="flex-row items-center">
          <View className="bg-admin-600 p-3 rounded-xl mr-4">
            <Navigation size={28} color="#ffffff" strokeWidth={2.5} />
          </View>
          <View className="flex-1">
            <Text className="text-white text-2xl font-bold">Gestionar Asignaciones</Text>
            <Text className="text-admin-100 text-sm mt-1">
              Asigna busetas y recorridos a choferes
            </Text>
          </View>
        </View>
      </View>

      <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>
        {/* Lista de Choferes */}
        <AnimatedCard delay={0} className="mb-4">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-bold text-gray-800">Choferes</Text>
            <View className="bg-chofer-100 px-3 py-1 rounded-full">
              <Text className="text-chofer-700 font-bold text-sm">
                {choferes.length} total
              </Text>
            </View>
          </View>

          {loading ? (
            <View className="py-8 items-center">
              <ActivityIndicator size="large" color="#16a34a" />
              <Text className="text-gray-500 mt-3">Cargando choferes...</Text>
            </View>
          ) : choferes.length === 0 ? (
            <View className="py-8 items-center">
              <UserCircle size={48} color="#9ca3af" strokeWidth={1.5} />
              <Text className="text-gray-500 mt-3 font-semibold">No hay choferes</Text>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row gap-3">
                {choferes.map((chofer) => (
                  <TouchableOpacity
                    key={chofer.id}
                    onPress={() => handleSeleccionarChofer(chofer)}
                    className={`px-4 py-3 rounded-xl border-2 min-w-[160px] ${
                      choferSeleccionado?.id === chofer.id
                        ? 'bg-chofer-100 border-chofer-600'
                        : 'bg-white border-gray-200'
                    }`}
                  >
                    <Text
                      className={`font-bold text-sm ${
                        choferSeleccionado?.id === chofer.id
                          ? 'text-chofer-800'
                          : 'text-gray-700'
                      }`}
                    >
                      {chofer.nombre} {chofer.apellido}
                    </Text>
                    <View className="flex-row items-center mt-2">
                      <Bus size={14} color={chofer.id_buseta ? '#16a34a' : '#9ca3af'} />
                      <Text
                        className={`text-xs ml-1 ${
                          chofer.id_buseta ? 'text-green-600' : 'text-gray-400'
                        }`}
                      >
                        {chofer.buseta_placa || 'Sin buseta'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          )}
        </AnimatedCard>

        {/* Sección de Chofer Seleccionado */}
        {choferSeleccionado && (
          <>
            {/* Buseta Asignada */}
            <AnimatedCard delay={100} className="mb-4">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-lg font-bold text-gray-800">Buseta Asignada</Text>
                <TouchableOpacity
                  onPress={() => setModalBusetaVisible(true)}
                  className="bg-buseta-100 px-3 py-1.5 rounded-lg"
                >
                  <Text className="text-buseta-700 font-semibold text-xs">Cambiar</Text>
                </TouchableOpacity>
              </View>

              {choferSeleccionado.id_buseta ? (
                <View className="bg-buseta-50 rounded-xl p-4 border border-buseta-200">
                  <View className="flex-row items-center">
                    <View className="bg-buseta-600 p-2 rounded-lg">
                      <Bus size={24} color="#ffffff" strokeWidth={2.5} />
                    </View>
                    <View className="ml-3">
                      <Text className="text-buseta-800 font-bold">
                        {choferSeleccionado.buseta_placa}
                      </Text>
                      <Text className="text-buseta-600 text-xs">Placa asignada</Text>
                    </View>
                  </View>
                </View>
              ) : (
                <View className="bg-gray-100 rounded-xl p-4 border border-dashed border-gray-300">
                  <Text className="text-gray-500 text-center">
                    Sin buseta asignada
                  </Text>
                </View>
              )}
            </AnimatedCard>

            {/* Recorridos */}
            <AnimatedCard delay={200} className="mb-6">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-lg font-bold text-gray-800">Recorridos</Text>
                <TouchableOpacity
                  onPress={handleAbrirModalAsignacion}
                  className="bg-admin-600 px-3 py-1.5 rounded-lg flex-row items-center"
                >
                  <Plus size={16} color="#ffffff" strokeWidth={2.5} />
                  <Text className="text-white font-semibold ml-1 text-xs">Agregar</Text>
                </TouchableOpacity>
              </View>

              {asignaciones.length === 0 ? (
                <View className="py-8 items-center">
                  <Calendar size={48} color="#9ca3af" strokeWidth={1.5} />
                  <Text className="text-gray-500 mt-3 font-semibold">
                    Sin recorridos asignados
                  </Text>
                  <Text className="text-gray-400 text-xs mt-1">
                    Agrega un recorrido con horario
                  </Text>
                </View>
              ) : (
                <View className="gap-3">
                  {asignaciones.map((asig) => {
                    const ruta = rutas.find((r) => r.id === asig.id_ruta);
                    return (
                      <View
                        key={asig.id}
                        className="bg-white rounded-xl p-4 border border-gray-200"
                      >
                        <View className="flex-row items-start justify-between mb-2">
                          <View className="flex-1">
                            <Text className="text-gray-800 font-bold text-base">
                              {ruta?.nombre || 'Ruta desconocida'}
                            </Text>
                            {asig.descripcion && (
                              <Text className="text-gray-600 text-sm mt-1">
                                {asig.descripcion}
                              </Text>
                            )}
                          </View>
                          <TouchableOpacity
                            onPress={() => handleEliminarAsignacion(asig.id)}
                            className="bg-red-100 p-2 rounded-lg"
                          >
                            <Trash2 size={16} color="#ef4444" strokeWidth={2} />
                          </TouchableOpacity>
                        </View>

                        <View className="flex-row items-center mt-2">
                          <Clock size={14} color="#ca8a04" strokeWidth={2} />
                          <Text className="text-chofer-700 text-sm ml-1 font-semibold">
                            {asig.hora_inicio.substring(0, 5)} -{' '}
                            {asig.hora_fin.substring(0, 5)}
                          </Text>
                        </View>

                        {asig.dias_semana && (
                          <View className="flex-row flex-wrap gap-1 mt-2">
                            {asig.dias_semana.map((dia) => (
                              <View
                                key={dia}
                                className="bg-admin-100 px-2 py-1 rounded"
                              >
                                <Text className="text-admin-700 text-xs font-semibold">
                                  {dia.substring(0, 3).toUpperCase()}
                                </Text>
                              </View>
                            ))}
                          </View>
                        )}

                        <View className="flex-row items-center mt-2">
                          {asig.activo ? (
                            <CheckCircle2 size={14} color="#16a34a" strokeWidth={2} />
                          ) : (
                            <XCircle size={14} color="#ef4444" strokeWidth={2} />
                          )}
                          <Text
                            className={`text-xs ml-1 font-semibold ${
                              asig.activo ? 'text-green-600' : 'text-red-600'
                            }`}
                          >
                            {asig.activo ? 'Activo' : 'Inactivo'}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </AnimatedCard>
          </>
        )}
      </ScrollView>

      {/* Modal Crear Asignación */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl p-6 max-h-[80%]">
            <Text className="text-xl font-bold text-gray-800 mb-4">
              Nuevo Recorrido
            </Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Seleccionar Ruta */}
              <Text className="text-gray-700 font-semibold mb-2">Ruta</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
                {rutas.map((ruta) => (
                  <TouchableOpacity
                    key={ruta.id}
                    onPress={() => setFormData({ ...formData, id_ruta: ruta.id })}
                    className={`px-4 py-2 rounded-lg mr-2 ${
                      formData.id_ruta === ruta.id
                        ? 'bg-admin-600'
                        : 'bg-gray-100 border border-gray-300'
                    }`}
                  >
                    <Text
                      className={`font-semibold ${
                        formData.id_ruta === ruta.id ? 'text-white' : 'text-gray-700'
                      }`}
                    >
                      {ruta.nombre}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Horarios */}
              <View className="flex-row gap-3 mb-4">
                <View className="flex-1">
                  <Text className="text-gray-700 font-semibold mb-2">Hora Inicio</Text>
                  <TextInput
                    value={formData.hora_inicio}
                    onChangeText={(text) => setFormData({ ...formData, hora_inicio: text })}
                    placeholder="06:00:00"
                    className="bg-gray-100 rounded-lg px-4 py-3 text-gray-800"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-gray-700 font-semibold mb-2">Hora Fin</Text>
                  <TextInput
                    value={formData.hora_fin}
                    onChangeText={(text) => setFormData({ ...formData, hora_fin: text })}
                    placeholder="07:00:00"
                    className="bg-gray-100 rounded-lg px-4 py-3 text-gray-800"
                  />
                </View>
              </View>

              {/* Descripción */}
              <Text className="text-gray-700 font-semibold mb-2">Descripción</Text>
              <TextInput
                value={formData.descripcion}
                onChangeText={(text) => setFormData({ ...formData, descripcion: text })}
                placeholder="Ej: Llevar estudiantes al colegio"
                className="bg-gray-100 rounded-lg px-4 py-3 text-gray-800 mb-4"
              />

              {/* Días de la semana */}
              <Text className="text-gray-700 font-semibold mb-2">Días activos</Text>

              {/* Botón "Todos los días" */}
              <TouchableOpacity
                onPress={toggleTodosDias}
                className={`mb-3 px-4 py-3 rounded-lg flex-row items-center justify-center ${
                  formData.dias_semana === undefined ? 'bg-admin-600' : 'bg-gray-100 border border-gray-300'
                }`}
              >
                <Calendar
                  size={20}
                  color={formData.dias_semana === undefined ? '#ffffff' : '#374151'}
                />
                <Text
                  className={`font-bold ml-2 ${
                    formData.dias_semana === undefined ? 'text-white' : 'text-gray-700'
                  }`}
                >
                  Todos los días
                </Text>
              </TouchableOpacity>

              {/* Días individuales */}
              <View className="flex-row flex-wrap gap-2 mb-6">
                {DIAS_SEMANA.map((dia) => {
                  const todosDiasActivo = formData.dias_semana === undefined;
                  const isSelected = formData.dias_semana?.includes(dia);
                  return (
                    <TouchableOpacity
                      key={dia}
                      onPress={() => toggleDia(dia)}
                      disabled={todosDiasActivo}
                      className={`px-4 py-2 rounded-lg ${
                        todosDiasActivo
                          ? 'bg-gray-200 opacity-50'
                          : isSelected
                          ? 'bg-admin-600'
                          : 'bg-gray-100 border border-gray-300'
                      }`}
                    >
                      <Text
                        className={`font-semibold text-sm ${
                          todosDiasActivo
                            ? 'text-gray-400'
                            : isSelected
                            ? 'text-white'
                            : 'text-gray-700'
                        }`}
                      >
                        {dia.substring(0, 3).toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Botones */}
              <View className="flex-row gap-3">
                <TouchableOpacity
                  onPress={() => setModalVisible(false)}
                  className="flex-1 bg-gray-200 py-3 rounded-lg"
                >
                  <Text className="text-gray-700 font-bold text-center">Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleCrearAsignacion}
                  className="flex-1 bg-admin-600 py-3 rounded-lg"
                >
                  <Text className="text-white font-bold text-center">Crear</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal Asignar Buseta Mejorado */}
      <Modal
        visible={modalBusetaVisible}
        animationType="slide"
        transparent
        onRequestClose={() => {
          setModalBusetaVisible(false);
          setBusetaFilter('');
        }}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl p-6 max-h-[80%]">
            <Text className="text-xl font-bold text-gray-800 mb-4">
              Seleccionar Buseta
            </Text>

            {/* Campo de búsqueda */}
            <TextInput
              value={busetaFilter}
              onChangeText={setBusetaFilter}
              placeholder="Buscar por placa..."
              className="bg-gray-100 rounded-lg px-4 py-3 mb-4"
            />

            <ScrollView showsVerticalScrollIndicator={false}>
              {busetas
                .filter((b) =>
                  b.placa.toLowerCase().includes(busetaFilter.toLowerCase())
                )
                .map((buseta) => (
                  <TouchableOpacity
                    key={buseta.id}
                    onPress={() => {
                      if (!buseta.ocupada && choferSeleccionado) {
                        handleAsignarBuseta(choferSeleccionado.id, buseta.id);
                      } else if (buseta.ocupada) {
                        haptic.error();
                        Alert.alert(
                          'Buseta ocupada',
                          `Esta buseta ya está asignada a ${buseta.chofer_nombre}. Primero desasigna al otro chofer.`
                        );
                      }
                    }}
                    disabled={buseta.ocupada}
                    className={`rounded-xl p-4 mb-3 border-2 ${
                      buseta.ocupada
                        ? 'bg-gray-100 border-gray-300 opacity-60'
                        : 'bg-buseta-50 border-buseta-200'
                    }`}
                  >
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center flex-1">
                        <View
                          className={`p-2 rounded-lg ${
                            buseta.ocupada ? 'bg-gray-400' : 'bg-buseta-600'
                          }`}
                        >
                          <Bus
                            size={24}
                            color="#ffffff"
                            strokeWidth={2.5}
                          />
                        </View>
                        <View className="ml-3 flex-1">
                          <Text
                            className={`font-bold text-lg ${
                              buseta.ocupada ? 'text-gray-600' : 'text-buseta-800'
                            }`}
                          >
                            {buseta.placa}
                          </Text>
                          {buseta.ocupada && (
                            <Text className="text-gray-500 text-xs mt-1">
                              Asignada a {buseta.chofer_nombre}
                            </Text>
                          )}
                        </View>
                      </View>
                      {buseta.ocupada ? (
                        <XCircle size={20} color="#ef4444" strokeWidth={2} />
                      ) : (
                        <CheckCircle2 size={20} color="#16a34a" strokeWidth={2} />
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
            </ScrollView>

            <TouchableOpacity
              onPress={() => {
                setModalBusetaVisible(false);
                setBusetaFilter('');
              }}
              className="bg-gray-200 py-3 rounded-lg mt-4"
            >
              <Text className="text-gray-700 font-bold text-center">Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
