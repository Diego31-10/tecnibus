import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

interface NotificacionAsistenciaRequest {
  id_estudiante: string;
  tipo: 'subio' | 'bajo' | 'ausente' | 'padre_ausente' | 'padre_presente';
  nombre_estudiante?: string;
  destinatario?: 'padre' | 'chofer'; // Por defecto 'padre' para compatibilidad
  id_ruta?: string; // Solo necesario cuando destinatario es 'chofer'
}

interface PushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: 'default' | null;
  badge?: number;
  channelId?: string;
}

Deno.serve(async (req) => {
  // Manejar CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Crear cliente Supabase con service role
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { id_estudiante, tipo, nombre_estudiante, destinatario = 'padre', id_ruta }: NotificacionAsistenciaRequest = await req.json();

    if (!id_estudiante || !tipo) {
      throw new Error('id_estudiante y tipo son requeridos');
    }

    if (destinatario === 'chofer' && !id_ruta) {
      throw new Error('id_ruta es requerido cuando el destinatario es chofer');
    }

    // 1. Obtener datos del estudiante
    const { data: estudiante, error: errorEstudiante } = await supabaseAdmin
      .from('estudiantes')
      .select(`
        id,
        nombre,
        apellido,
        id_padre,
        padres (
          id,
          profiles (
            id,
            push_token
          )
        )
      `)
      .eq('id', id_estudiante)
      .single();

    if (errorEstudiante || !estudiante) {
      console.error('Error obteniendo estudiante:', errorEstudiante);
      throw new Error('Estudiante no encontrado');
    }

    // 2. Obtener push token según destinatario
    let pushToken: string | null = null;
    let nombreDestinatario = '';

    if (destinatario === 'padre') {
      const padre = estudiante.padres;
      pushToken = padre?.profiles?.push_token;
      nombreDestinatario = 'padre';
    } else {
      // Obtener chofer de la ruta
      const { data: choferData, error: errorChofer } = await supabaseAdmin
        .rpc('get_chofer_de_ruta', { p_id_ruta: id_ruta });

      if (errorChofer || !choferData) {
        console.error('Error obteniendo chofer de la ruta:', errorChofer);
        throw new Error('No hay chofer asignado a esta ruta');
      }

      // Obtener push token del chofer
      const { data: profile, error: errorProfile } = await supabaseAdmin
        .from('profiles')
        .select('push_token')
        .eq('id', choferData)
        .single();

      if (errorProfile || !profile) {
        console.error('Error obteniendo perfil del chofer:', errorProfile);
        throw new Error('Perfil del chofer no encontrado');
      }

      pushToken = profile.push_token;
      nombreDestinatario = 'chofer';
    }

    if (!pushToken || !pushToken.startsWith('ExponentPushToken')) {
      console.log(`${nombreDestinatario} no tiene push token válido`);
      return new Response(JSON.stringify({
        success: true,
        message: `${nombreDestinatario} no tiene notificaciones habilitadas`,
        sent: 0
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // 3. Construir mensaje según tipo
    const nombreCompleto = nombre_estudiante || `${estudiante.nombre} ${estudiante.apellido}`;
    let titulo = '';
    let mensaje = '';

    switch (tipo) {
      case 'subio':
        titulo = '🚌 Estudiante abordó la buseta';
        mensaje = `${nombreCompleto} subió a la buseta`;
        break;
      case 'bajo':
        titulo = '✅ Estudiante llegó a destino';
        mensaje = `${nombreCompleto} bajó de la buseta`;
        break;
      case 'ausente':
        titulo = '⚠️ Estudiante ausente';
        mensaje = `${nombreCompleto} no se presentó a la parada`;
        break;
      case 'padre_ausente':
        titulo = '⚠️ Padre reportó ausencia';
        mensaje = `${nombreCompleto} no asistirá hoy. Marcado por el padre.`;
        break;
      case 'padre_presente':
        titulo = '✅ Padre confirmó asistencia';
        mensaje = `${nombreCompleto} confirmó asistencia para hoy.`;
        break;
      default:
        titulo = '📢 Actualización de asistencia';
        mensaje = `Actualización sobre ${nombreCompleto}`;
    }

    // 4. Enviar notificación push
    const pushMessage: PushMessage = {
      to: pushToken,
      title: titulo,
      body: mensaje,
      sound: 'default',
      data: {
        tipo: 'asistencia',
        id_estudiante,
        accion: tipo,
        timestamp: new Date().toISOString(),
      },
      channelId: 'recorrido',
    };

    const pushResponse = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([pushMessage]),
    });

    const pushResult = await pushResponse.json();

    const success = pushResult.data?.[0]?.status === 'ok';

    console.log(`Notificación enviada a ${nombreDestinatario} sobre ${nombreCompleto}: ${success ? 'éxito' : 'fallo'}`);

    return new Response(JSON.stringify({
      success: true,
      sent: success ? 1 : 0,
      message: success ? 'Notificación enviada' : 'Error al enviar notificación',
      pushResult,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error('Error en notificar-asistencia:', error);

    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Error desconocido'
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
