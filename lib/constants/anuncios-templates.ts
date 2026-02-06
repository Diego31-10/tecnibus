export interface TemplateAnuncio {
  id: string;
  nombre: string;
  icono: string;
  categoria: 'operativo' | 'informativo' | 'emergencia' | 'general';
  titulo: string;
  mensaje: string;
  audienciaSugerida: 'todos' | 'padres' | 'choferes';
}

export const TEMPLATES_ANUNCIOS: TemplateAnuncio[] = [
  // CATEGORÍA: OPERATIVO
  {
    id: 'cambio-horario',
    nombre: 'Cambio de Horario',
    icono: '🕐',
    categoria: 'operativo',
    titulo: 'Cambio de Horario',
    mensaje: 'Informamos que mañana [día] habrá un cambio en el horario de las rutas. La nueva hora de salida será a las [hora]. Disculpen las molestias.',
    audienciaSugerida: 'padres',
  },
  {
    id: 'suspension-servicio',
    nombre: 'Suspensión de Servicio',
    icono: '🚫',
    categoria: 'operativo',
    titulo: 'Servicio Suspendido',
    mensaje: 'Debido a [motivo], el servicio de transporte estará suspendido el día [fecha]. El servicio se reanudará normalmente el [fecha].',
    audienciaSugerida: 'todos',
  },
  {
    id: 'retraso-ruta',
    nombre: 'Retraso en Ruta',
    icono: '⏰',
    categoria: 'operativo',
    titulo: 'Retraso en Recorrido',
    mensaje: 'La ruta [nombre] presenta un retraso de aproximadamente [minutos] minutos debido a [motivo]. Agradecemos su comprensión.',
    audienciaSugerida: 'padres',
  },
  {
    id: 'nueva-ruta',
    nombre: 'Nueva Ruta',
    icono: '🆕',
    categoria: 'operativo',
    titulo: 'Nueva Ruta Disponible',
    mensaje: 'A partir del [fecha] estará disponible una nueva ruta: [nombre]. Horarios y paradas en la sección de información.',
    audienciaSugerida: 'todos',
  },

  // CATEGORÍA: INFORMATIVO
  {
    id: 'recordatorio-pago',
    nombre: 'Recordatorio de Pago',
    icono: '💰',
    categoria: 'informativo',
    titulo: 'Recordatorio de Pago',
    mensaje: 'Les recordamos que el pago del servicio de transporte del mes de [mes] vence el [fecha]. Por favor, realicen el pago a tiempo.',
    audienciaSugerida: 'padres',
  },
  {
    id: 'mantenimiento-buseta',
    nombre: 'Mantenimiento de Buseta',
    icono: '🔧',
    categoria: 'informativo',
    titulo: 'Mantenimiento Programado',
    mensaje: 'La buseta [placa] entrará en mantenimiento el [fecha]. Durante este período, se asignará un vehículo temporal para la ruta.',
    audienciaSugerida: 'padres',
  },
  {
    id: 'reunion-padres',
    nombre: 'Reunión de Padres',
    icono: '👥',
    categoria: 'informativo',
    titulo: 'Reunión de Padres',
    mensaje: 'Los invitamos a la reunión informativa sobre el servicio de transporte el [fecha] a las [hora]. Lugar: [ubicación].',
    audienciaSugerida: 'padres',
  },
  {
    id: 'capacitacion-choferes',
    nombre: 'Capacitación Choferes',
    icono: '📚',
    categoria: 'informativo',
    titulo: 'Capacitación Programada',
    mensaje: 'Recordatorio: Capacitación obligatoria el [fecha] a las [hora] en [lugar]. Tema: [tema]. Confirmen su asistencia.',
    audienciaSugerida: 'choferes',
  },

  // CATEGORÍA: EMERGENCIA
  {
    id: 'alerta-climatica',
    nombre: 'Alerta Climática',
    icono: '⛈️',
    categoria: 'emergencia',
    titulo: '⚠️ Alerta Climática',
    mensaje: 'Debido a las condiciones climáticas adversas, se recomienda precaución. Monitoreamos la situación y les mantendremos informados.',
    audienciaSugerida: 'todos',
  },
  {
    id: 'emergencia-mecanica',
    nombre: 'Emergencia Mecánica',
    icono: '🚨',
    categoria: 'emergencia',
    titulo: '🚨 Emergencia Mecánica',
    mensaje: 'La buseta [placa] presenta una falla mecánica. Todos los estudiantes están seguros. Se ha enviado un vehículo de reemplazo.',
    audienciaSugerida: 'padres',
  },
  {
    id: 'cierre-vial',
    nombre: 'Cierre Vial',
    icono: '🚧',
    categoria: 'emergencia',
    titulo: 'Cierre de Vía',
    mensaje: 'La vía [nombre] está cerrada temporalmente. Las rutas tomarán una ruta alterna, lo que puede generar retrasos de [minutos] minutos.',
    audienciaSugerida: 'todos',
  },

  // CATEGORÍA: GENERAL
  {
    id: 'felicitacion-festividad',
    nombre: 'Felicitación Festividad',
    icono: '🎉',
    categoria: 'general',
    titulo: 'Feliz [Festividad]',
    mensaje: 'El equipo de TecniBus les desea una feliz [festividad]. Que disfruten estos días en compañía de sus seres queridos. 🎊',
    audienciaSugerida: 'todos',
  },
  {
    id: 'bienvenida-estudiantes',
    nombre: 'Bienvenida Estudiantes',
    icono: '🎒',
    categoria: 'general',
    titulo: '¡Bienvenidos!',
    mensaje: 'Damos la bienvenida a todos los estudiantes al nuevo año escolar. Estamos comprometidos con su seguridad y puntualidad. 🚌📚',
    audienciaSugerida: 'todos',
  },
  {
    id: 'mejora-servicio',
    nombre: 'Mejora en Servicio',
    icono: '⭐',
    categoria: 'general',
    titulo: 'Mejoras en el Servicio',
    mensaje: 'Hemos implementado [mejora] para brindarles un mejor servicio. Sus comentarios y sugerencias son siempre bienvenidos.',
    audienciaSugerida: 'todos',
  },
  {
    id: 'agradecimiento',
    nombre: 'Agradecimiento',
    icono: '🙏',
    categoria: 'general',
    titulo: 'Agradecimiento',
    mensaje: 'Queremos agradecer su confianza y apoyo continuo. Trabajamos cada día para mejorar nuestro servicio y su experiencia.',
    audienciaSugerida: 'todos',
  },
];

export const CATEGORIAS_TEMPLATES = [
  { id: 'operativo', nombre: 'Operativo', icono: '🚌', color: '#2563eb' },
  { id: 'informativo', nombre: 'Informativo', icono: 'ℹ️', color: '#16a34a' },
  { id: 'emergencia', nombre: 'Emergencia', icono: '🚨', color: '#dc2626' },
  { id: 'general', nombre: 'General', icono: '📢', color: '#9333ea' },
];
