import { CATEGORIAS_TEMPLATES, TEMPLATES_ANUNCIOS, TemplateAnuncio } from '@/lib/constants/anuncios-templates';
import { Colors } from '@/lib/constants/colors';
import { haptic } from '@/lib/utils/haptics';
import { createShadow } from '@/lib/utils/shadows';
import { router } from 'expo-router';
import { ArrowLeft, FileText, Megaphone, Send, X } from 'lucide-react-native';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../lib/services/supabase';

type Audiencia = 'todos' | 'padres' | 'choferes';

export default function AnunciosScreen() {
  const insets = useSafeAreaInsets();
  const [titulo, setTitulo] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [audiencia, setAudiencia] = useState<Audiencia>('todos');
  const [loading, setLoading] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string | null>(null);

  const paddingTop = Math.max(insets.top + 8, 48);
  const shadow = createShadow('md');

  const handleEnviar = async () => {
    // Validaciones
    if (!titulo.trim()) {
      Alert.alert('Error', 'El título es obligatorio');
      return;
    }

    if (!mensaje.trim()) {
      Alert.alert('Error', 'El mensaje es obligatorio');
      return;
    }

    if (titulo.length > 100) {
      Alert.alert('Error', 'El título no puede superar 100 caracteres');
      return;
    }

    if (mensaje.length > 500) {
      Alert.alert('Error', 'El mensaje no puede superar 500 caracteres');
      return;
    }

    // Confirmar antes de enviar
    const audienciaText = audiencia === 'todos' ? 'todos los usuarios' :
                          audiencia === 'padres' ? 'todos los padres' :
                          'todos los choferes';

    Alert.alert(
      '📢 Confirmar envío',
      `¿Enviar este anuncio a ${audienciaText}?\n\n"${titulo}"\n\nEsta acción no se puede deshacer.`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Enviar',
          style: 'default',
          onPress: enviarAnuncio,
        },
      ]
    );
  };

  const enviarAnuncio = async () => {
    setLoading(true);
    haptic.light();

    try {
      const { data, error } = await supabase.functions.invoke('broadcast-anuncio', {
        body: {
          titulo: titulo.trim(),
          mensaje: mensaje.trim(),
          audiencia,
        },
      });

      if (error) {
        console.error('Error enviando anuncio:', error);
        Alert.alert('Error', 'No se pudo enviar el anuncio. Intenta nuevamente.');
        return;
      }

      console.log('Resultado del envío:', data);

      // Mostrar resultado
      const enviados = data?.sent || 0;
      const fallidos = data?.failed || 0;

      Alert.alert(
        '✅ Anuncio enviado',
        `Se enviaron ${enviados} notificaciones correctamente.${
          fallidos > 0 ? `\n\n${fallidos} notificaciones fallaron.` : ''
        }`,
        [
          {
            text: 'OK',
            onPress: () => {
              // Limpiar formulario
              setTitulo('');
              setMensaje('');
              setAudiencia('todos');
            },
          },
        ]
      );

      haptic.success();
    } catch (error) {
      console.error('Error en enviarAnuncio:', error);
      Alert.alert('Error', 'Ocurrió un error inesperado. Intenta nuevamente.');
      haptic.error();
    } finally {
      setLoading(false);
    }
  };

  const getAudienciaColor = (tipo: Audiencia) => {
    return audiencia === tipo ? Colors.sky[600] : Colors.sky[300];
  };

  const getAudienciaTextColor = (tipo: Audiencia) => {
    return audiencia === tipo ? Colors.sky[50] : Colors.sky[600];
  };

  const handleSeleccionarTemplate = (template: TemplateAnuncio) => {
    setTitulo(template.titulo);
    setMensaje(template.mensaje);
    setAudiencia(template.audienciaSugerida);
    setShowTemplates(false);
    haptic.success();
  };

  const templatesFiltrados = categoriaSeleccionada
    ? TEMPLATES_ANUNCIOS.filter(t => t.categoria === categoriaSeleccionada)
    : TEMPLATES_ANUNCIOS;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.sky[50] }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="dark-content" backgroundColor={Colors.sky[50]} />

      {/* Header */}
      <View
        style={[
          {
            paddingTop,
            paddingHorizontal: 16,
            paddingBottom: 16,
            backgroundColor: Colors.sky[50],
            borderBottomWidth: 1,
            borderBottomColor: Colors.sky[200],
          },
          shadow,
        ]}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <TouchableOpacity
            onPress={() => {
              haptic.light();
              router.back();
            }}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: Colors.sky[100],
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ArrowLeft size={20} color={Colors.sky[700]} />
          </TouchableOpacity>

          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 20,
                fontWeight: '700',
                color: Colors.sky[900],
              }}
            >
              📢 Enviar Anuncios
            </Text>
            <Text style={{ fontSize: 14, color: Colors.sky[500], marginTop: 2 }}>
              Notificaciones push masivas
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, gap: 16 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Botón Usar Template */}
        <TouchableOpacity
          onPress={() => {
            haptic.light();
            setShowTemplates(true);
          }}
          style={{
            backgroundColor: Colors.estudiante[50],
            paddingVertical: 14,
            paddingHorizontal: 16,
            borderRadius: 8,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            borderWidth: 1,
            borderColor: Colors.estudiante[100],
          }}
        >
          <FileText size={20} color={Colors.estudiante[700]} />
          <Text
            style={{
              fontSize: 15,
              fontWeight: '600',
              color: Colors.estudiante[700],
            }}
          >
            Usar Template
          </Text>
        </TouchableOpacity>

        {/* Selector de Audiencia */}
        <View>
          <Text
            style={{
              fontSize: 16,
              fontWeight: '600',
              color: Colors.sky[900],
              marginBottom: 12,
            }}
          >
            Audiencia
          </Text>

          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              onPress={() => {
                haptic.light();
                setAudiencia('todos');
              }}
              style={{
                flex: 1,
                backgroundColor: getAudienciaColor('todos'),
                paddingVertical: 12,
                paddingHorizontal: 16,
                borderRadius: 8,
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: getAudienciaTextColor('todos'),
                }}
              >
                👥 Todos
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                haptic.light();
                setAudiencia('padres');
              }}
              style={{
                flex: 1,
                backgroundColor: getAudienciaColor('padres'),
                paddingVertical: 12,
                paddingHorizontal: 16,
                borderRadius: 8,
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: getAudienciaTextColor('padres'),
                }}
              >
                👨‍👩‍👧 Padres
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                haptic.light();
                setAudiencia('choferes');
              }}
              style={{
                flex: 1,
                backgroundColor: getAudienciaColor('choferes'),
                paddingVertical: 12,
                paddingHorizontal: 16,
                borderRadius: 8,
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: getAudienciaTextColor('choferes'),
                }}
              >
                🚌 Choferes
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Campo Título */}
        <View>
          <Text
            style={{
              fontSize: 16,
              fontWeight: '600',
              color: Colors.sky[900],
              marginBottom: 8,
            }}
          >
            Título
          </Text>
          <TextInput
            value={titulo}
            onChangeText={setTitulo}
            placeholder="Título del anuncio (max. 100 caracteres)"
            placeholderTextColor={Colors.sky[400]}
            maxLength={100}
            style={{
              backgroundColor: Colors.sky[50],
              borderWidth: 1,
              borderColor: Colors.sky[300],
              borderRadius: 8,
              paddingVertical: 12,
              paddingHorizontal: 16,
              fontSize: 16,
              color: Colors.sky[900],
            }}
          />
          <Text
            style={{
              fontSize: 12,
              color: Colors.sky[500],
              marginTop: 4,
              textAlign: 'right',
            }}
          >
            {titulo.length}/100
          </Text>
        </View>

        {/* Campo Mensaje */}
        <View>
          <Text
            style={{
              fontSize: 16,
              fontWeight: '600',
              color: Colors.sky[900],
              marginBottom: 8,
            }}
          >
            Mensaje
          </Text>
          <TextInput
            value={mensaje}
            onChangeText={setMensaje}
            placeholder="Escribe el mensaje del anuncio (max. 500 caracteres)"
            placeholderTextColor={Colors.sky[400]}
            multiline
            numberOfLines={6}
            maxLength={500}
            textAlignVertical="top"
            style={{
              backgroundColor: Colors.sky[50],
              borderWidth: 1,
              borderColor: Colors.sky[300],
              borderRadius: 8,
              paddingVertical: 12,
              paddingHorizontal: 16,
              fontSize: 16,
              color: Colors.sky[900],
              minHeight: 120,
            }}
          />
          <Text
            style={{
              fontSize: 12,
              color: Colors.sky[500],
              marginTop: 4,
              textAlign: 'right',
            }}
          >
            {mensaje.length}/500
          </Text>
        </View>

        {/* Vista Previa */}
        {(titulo || mensaje) && (
          <View
            style={{
              backgroundColor: Colors.sky[50],
              borderWidth: 1,
              borderColor: Colors.sky[300],
              borderRadius: 8,
              padding: 16,
              marginTop: 8,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Megaphone size={16} color={Colors.sky[600]} />
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '600',
                  color: Colors.sky[600],
                  textTransform: 'uppercase',
                }}
              >
                Vista Previa
              </Text>
            </View>

            {titulo ? (
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: Colors.sky[900],
                  marginBottom: 4,
                }}
              >
                📢 {titulo}
              </Text>
            ) : null}

            {mensaje ? (
              <Text style={{ fontSize: 14, color: Colors.sky[700], lineHeight: 20 }}>
                {mensaje}
              </Text>
            ) : null}
          </View>
        )}

        {/* Botón Enviar */}
        <TouchableOpacity
          onPress={handleEnviar}
          disabled={loading || !titulo.trim() || !mensaje.trim()}
          style={{
            backgroundColor:
              loading || !titulo.trim() || !mensaje.trim()
                ? Colors.sky[300]
                : Colors.sky[600],
            paddingVertical: 16,
            borderRadius: 8,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            marginTop: 16,
          }}
        >
          {loading ? (
            <ActivityIndicator size="small" color={Colors.sky[50]} />
          ) : (
            <>
              <Send size={20} color={Colors.sky[50]} />
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: Colors.sky[50],
                }}
              >
                Enviar Anuncio
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Info */}
        <View
          style={{
            backgroundColor: Colors.estudiante[50],
            padding: 12,
            borderRadius: 8,
            borderLeftWidth: 4,
            borderLeftColor: Colors.estudiante[500],
          }}
        >
          <Text style={{ fontSize: 14, color: Colors.estudiante[800], lineHeight: 20 }}>
            💡 <Text style={{ fontWeight: '600' }}>Consejo:</Text> Las notificaciones se enviarán
            solo a usuarios con notificaciones habilitadas y dispositivos registrados.
          </Text>
        </View>
      </ScrollView>

      {/* Modal de Templates */}
      <Modal
        visible={showTemplates}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowTemplates(false)}
      >
        <View style={{ flex: 1, backgroundColor: Colors.sky[50] }}>
          <StatusBar barStyle="dark-content" />

          {/* Header del Modal */}
          <View
            style={[
              {
                paddingTop: paddingTop,
                paddingHorizontal: 16,
                paddingBottom: 16,
                backgroundColor: Colors.sky[50],
                borderBottomWidth: 1,
                borderBottomColor: Colors.sky[200],
              },
              shadow,
            ]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <TouchableOpacity
                onPress={() => {
                  haptic.light();
                  setShowTemplates(false);
                  setCategoriaSeleccionada(null);
                }}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: Colors.sky[100],
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={20} color={Colors.sky[700]} />
              </TouchableOpacity>

              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 20, fontWeight: '700', color: Colors.sky[900] }}>
                  Templates de Anuncios
                </Text>
                <Text style={{ fontSize: 14, color: Colors.sky[500], marginTop: 2 }}>
                  {categoriaSeleccionada ? 'Selecciona un template' : 'Elige una categoría'}
                </Text>
              </View>
            </View>
          </View>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 16 }}>
            {!categoriaSeleccionada ? (
              // Vista de Categorías
              <>
                {CATEGORIAS_TEMPLATES.map((categoria) => (
                  <TouchableOpacity
                    key={categoria.id}
                    onPress={() => {
                      haptic.light();
                      setCategoriaSeleccionada(categoria.id);
                    }}
                    style={{
                      backgroundColor: Colors.sky[50],
                      borderRadius: 12,
                      padding: 16,
                      borderWidth: 1,
                      borderColor: Colors.sky[200],
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 12,
                    }}
                  >
                    <View
                      style={{
                        width: 50,
                        height: 50,
                        borderRadius: 25,
                        backgroundColor: `${categoria.color}20`,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text style={{ fontSize: 24 }}>{categoria.icono}</Text>
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontSize: 17,
                          fontWeight: '600',
                          color: Colors.sky[900],
                        }}
                      >
                        {categoria.nombre}
                      </Text>
                      <Text style={{ fontSize: 13, color: Colors.sky[500], marginTop: 2 }}>
                        {TEMPLATES_ANUNCIOS.filter((t) => t.categoria === categoria.id).length}{' '}
                        templates disponibles
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </>
            ) : (
              // Vista de Templates de la Categoría
              <>
                <TouchableOpacity
                  onPress={() => {
                    haptic.light();
                    setCategoriaSeleccionada(null);
                  }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                    paddingVertical: 8,
                  }}
                >
                  <ArrowLeft size={20} color={Colors.estudiante[600]} />
                  <Text style={{ fontSize: 15, fontWeight: '600', color: Colors.estudiante[600] }}>
                    Ver todas las categorías
                  </Text>
                </TouchableOpacity>

                {templatesFiltrados.map((template) => (
                  <TouchableOpacity
                    key={template.id}
                    onPress={() => handleSeleccionarTemplate(template)}
                    style={{
                      backgroundColor: Colors.sky[50],
                      borderRadius: 12,
                      padding: 16,
                      borderWidth: 1,
                      borderColor: Colors.sky[200],
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                      <Text style={{ fontSize: 28 }}>{template.icono}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 16, fontWeight: '600', color: Colors.sky[900] }}>
                          {template.nombre}
                        </Text>
                        <Text style={{ fontSize: 12, color: Colors.sky[500], marginTop: 2 }}>
                          Audiencia sugerida:{' '}
                          {template.audienciaSugerida === 'todos'
                            ? '👥 Todos'
                            : template.audienciaSugerida === 'padres'
                            ? '👨‍👩‍👧 Padres'
                            : '🚌 Choferes'}
                        </Text>
                      </View>
                    </View>

                    <View
                      style={{
                        backgroundColor: Colors.sky[50],
                        padding: 12,
                        borderRadius: 8,
                        borderLeftWidth: 3,
                        borderLeftColor: Colors.sky[500],
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: '600',
                          color: Colors.sky[900],
                          marginBottom: 4,
                        }}
                      >
                        {template.titulo}
                      </Text>
                      <Text
                        style={{
                          fontSize: 13,
                          color: Colors.sky[600],
                          lineHeight: 18,
                        }}
                        numberOfLines={3}
                      >
                        {template.mensaje}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </>
            )}
          </ScrollView>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}
