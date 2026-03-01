# TecniBus — Documentación Oficial (ES)

> Documentación técnica y funcional del proyecto TecniBus.  
> Para la versión en inglés, consulta [DOCS (EN)](DOCS-(EN)).

---

## Tabla de Contenidos

1. [Descripción General](#descripción-general)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Roles y Permisos](#roles-y-permisos)
4. [Funcionalidades Principales](#funcionalidades-principales)
   - [Seguimiento GPS en Tiempo Real](#seguimiento-gps-en-tiempo-real)
   - [Gestión de Rutas](#gestión-de-rutas)
   - [Control de Asistencia](#control-de-asistencia)
   - [Exportación de Reportes en PDF](#exportación-de-reportes-en-pdf)
   - [Chat Padre–Conductor](#chat-padreconductor)
   - [Importación Masiva por CSV](#importación-masiva-por-csv)
   - [Notificaciones Push](#notificaciones-push)
5. [Stack Tecnológico](#stack-tecnológico)
6. [Seguridad](#seguridad)
7. [Configuración del Entorno](#configuración-del-entorno)
8. [Estructura del Proyecto](#estructura-del-proyecto)
9. [Base de Datos](#base-de-datos)
10. [Edge Functions (Supabase)](#edge-functions-supabase)
11. [Contexto Académico](#contexto-académico)

---

## Descripción General

**TecniBus** es una aplicación móvil multiplataforma para la gestión integral del transporte escolar institucional. Centraliza en una única plataforma con roles diferenciados el rastreo GPS en tiempo real, la gestión de rutas, el control de asistencia, la comunicación directa entre padres y conductores, y la generación automatizada de reportes.

**Roles:** Administrador · Conductor · Padre de familia

---

## Arquitectura del Sistema

El cliente móvil se encarga exclusivamente de la interfaz de usuario y la interacción. Todas las operaciones privilegiadas se ejecutan en el servidor.

| Capa | Tecnología | Responsabilidad |
|---|---|---|
| Cliente | Expo (React Native) + TypeScript | UI, navegación, interacción del usuario |
| Backend | Supabase (PostgreSQL + Auth + Realtime + Storage) | Datos, autenticación, sincronización en tiempo real |
| Edge Functions | Deno (Supabase) | PDF, importación CSV, notificaciones, rutas |
| Mapas | Google Maps SDK (cliente) + Directions API (servidor) | Visualización y cálculo de rutas |
| Notificaciones | Firebase Cloud Messaging (FCM) | Alertas de proximidad al paradero |

> La `service_role_key` y todas las claves de API del servidor residen únicamente en las variables de entorno de las Edge Functions y nunca se incluyen en el bundle de la aplicación.

---

## Roles y Permisos

### Administrador
- Gestionar usuarios (administradores, conductores, padres, estudiantes).
- Crear, editar y eliminar rutas y paraderos.
- Asignar conductores y buses a rutas.
- Ver y exportar reportes de asistencia en PDF.
- Importar datos masivos mediante archivos CSV.
- Enviar anuncios a todos los usuarios.

### Conductor
- Visualizar rutas y paraderos asignados para el día.
- Iniciar y finalizar recorridos.
- Marcar asistencia de estudiantes en cada paradero.
- Ver la ubicación en tiempo real de su bus en el mapa.
- Chatear con padres de familia durante un recorrido activo.

### Padre de familia
- Rastrear en tiempo real la ubicación del bus.
- Ver el tiempo estimado de llegada (ETA) al paradero.
- Consultar el historial de asistencia de su hijo/a.
- Chatear con el conductor del bus asignado durante un recorrido activo.
- Recibir notificaciones push cuando el bus se acerca al paradero.

---

## Funcionalidades Principales

### Seguimiento GPS en Tiempo Real

El conductor transmite su posición GPS mediante `expo-location`. La ubicación se almacena en Supabase y se distribuye a los clientes suscritos a través de **Supabase Realtime (WebSocket)**.

- **Conductor:** la posición se guarda periódicamente durante el recorrido activo.
- **Padre:** se suscribe al canal en tiempo real y ve la posición del bus actualizada en el mapa.
- **ETA:** se calcula mediante geocercas y la API de Directions (ejecutada en Edge Function).

### Gestión de Rutas

- Constructor de rutas interactivo con Google Maps.
- Secuenciación de paraderos con arrastrar y soltar.
- Renderizado de polilínea de la ruta en el mapa.
- Asignación de conductores y buses a rutas.
- Soporte para días de servicio configurables.

### Control de Asistencia

- Registro de asistencia por paradero durante el recorrido.
- Marcado de presencia/ausencia por estudiante.
- Registro de hora de check-in.
- Historial de asistencia consultable por el padre y el administrador.
- Sincronización en tiempo real mediante Supabase Realtime.

### Exportación de Reportes en PDF

Los reportes de asistencia se generan **completamente en el servidor** mediante una Edge Function de Supabase.

**Flujo:**
1. El administrador solicita un reporte desde la aplicación.
2. La Edge Function `generate-attendance-report` consulta la base de datos, genera el PDF y lo almacena en **Supabase Storage** (bucket `reportes`).
3. Se devuelve una **URL firmada con expiración** al cliente.
4. El cliente abre o descarga el PDF desde esa URL.

> Los archivos de reporte nunca son accesibles públicamente; solo se pueden obtener mediante URLs firmadas con tiempo de expiración.

### Chat Padre–Conductor

Funcionalidad de mensajería directa en tiempo real entre un padre de familia y el conductor del bus asignado, disponible **únicamente durante un recorrido activo**.

**Características:**
- Mensajes en tiempo real mediante **Supabase Realtime**.
- **Mensajes rápidos predefinidos** (Quick Messages) para respuestas frecuentes.
- Indicador de mensajes no leídos en la lista de conversaciones.
- Modo de **solo lectura** cuando el recorrido ha finalizado.
- El padre puede iniciar la conversación desde la pantalla de seguimiento.
- El conductor puede ver y responder a todos los padres de su ruta activa.

**Flujo — Padre:**
1. Ir a la pantalla de seguimiento del recorrido.
2. Tocar el botón de chat para abrir la conversación con el conductor.
3. Enviar mensajes de texto libre o seleccionar un mensaje rápido.
4. Los mensajes son visibles para el conductor en tiempo real.

**Flujo — Conductor:**
1. Ir a la sección **Chats** desde el menú de conductor.
2. Seleccionar la conversación con el padre deseado.
3. Enviar mensajes de texto libre o seleccionar un mensaje rápido.
4. Los mensajes son visibles para el padre en tiempo real.

### Importación Masiva por CSV

Permite cargar múltiples registros de una sola vez sin introducción manual de datos, a través de la Edge Function `import-entities`.

**Entidades soportadas:**
- `padres` — Padres de familia
- `conductores` — Conductores
- `estudiantes` — Estudiantes
- `buses` — Buses/busetas

**Formato del archivo:**
- Tipo: CSV (separado por comas)
- Tamaño máximo: 2 MB
- Máximo de filas: 1 000 por importación
- Codificación: UTF-8

**Proceso:**
1. Desde el panel de administración, ir a **Importar datos**.
2. Seleccionar la entidad a importar (padres, conductores, estudiantes o buses).
3. Cargar el archivo CSV con el formato correspondiente.
4. La Edge Function valida cada fila, crea las cuentas en Supabase Auth y registra los datos.
5. Se devuelve un resumen con el total de filas procesadas, insertadas y los errores encontrados.

> Las importaciones con errores son parciales: las filas válidas se insertan y las erróneas se reportan con el número de fila y la descripción del problema.

### Notificaciones Push

Las notificaciones se envían mediante **Firebase Cloud Messaging (FCM)**.

- **Alerta de proximidad:** el padre recibe una notificación cuando el bus entra en la geocerca del paradero.
- **Anuncios:** el administrador puede enviar mensajes generales a todos los usuarios mediante la Edge Function `broadcast-anuncio`.
- Los tokens de dispositivo se gestionan a través de la tabla `push_tokens` en Supabase.

---

## Stack Tecnológico

### Frontend
| Tecnología | Versión | Uso |
|---|---|---|
| React Native | 0.81.5 | Framework móvil multiplataforma |
| Expo SDK | 54 | Herramientas y APIs nativas |
| TypeScript | ~5.9 (strict) | Tipado estático |
| Expo Router v6 | ~6.0 | Navegación basada en archivos |
| NativeWind v4 | ^4.2 | Estilos con Tailwind CSS |
| react-native-maps | 1.20.1 | Mapas y marcadores |
| expo-location | ~19.0 | GPS del dispositivo |
| react-native-reanimated | ~4.1 | Animaciones fluidas |

### Backend
| Tecnología | Uso |
|---|---|
| Supabase (PostgreSQL) | Base de datos relacional |
| Supabase Auth | Autenticación email/contraseña |
| Supabase Realtime | Sincronización en tiempo real (WebSocket) |
| Supabase Storage | Almacenamiento de archivos (PDFs) |
| Edge Functions (Deno) | Lógica de negocio del lado del servidor |
| Row Level Security | Control de acceso a nivel de fila |

### Infraestructura y Servicios Externos
| Servicio | Uso |
|---|---|
| Supabase Cloud | Hosting del backend |
| Expo EAS | Build y distribución de la app |
| Firebase Cloud Messaging | Notificaciones push |
| Google Maps SDK | Visualización de mapas (cliente) |
| Google Directions API | Cálculo de rutas (solo servidor) |

---

## Seguridad

- **Separación de claves de API:** la clave del SDK de Google Maps (cliente, restringida por paquete) y la clave de la API de Directions (solo servidor) son credenciales distintas. La clave de Directions nunca se incluye en el bundle de la aplicación.
- **Generación de PDF en el servidor:** los reportes se crean y almacenan dentro de Edge Functions. Los clientes solo reciben URLs firmadas con tiempo de expiración.
- **Row Level Security (RLS):** aplicado en todas las tablas. Ningún rol puede leer ni escribir datos fuera de su ámbito.
- **URLs firmadas:** los archivos de reportes en Supabase Storage solo son accesibles mediante URLs con expiración configurada.
- **Gestión de secretos:** todas las credenciales se gestionan mediante variables de entorno o secretos de Edge Functions de Supabase. Nada está hardcodeado.
- **Chat solo durante recorrido activo:** los mensajes solo pueden enviarse mientras hay un recorrido en curso, evitando comunicación no autorizada.

---

## Configuración del Entorno

### Requisitos Previos

- Node.js ≥ 18
- Expo CLI (`npm install -g expo-cli`)
- Cuenta de Supabase con proyecto configurado
- Cuenta de Firebase (para FCM)
- Claves de Google Maps (SDK para cliente y Directions API para servidor)

### Variables de Entorno

Copiar el archivo `.env.example` como `.env` en la raíz del proyecto y completar los valores:

```env
EXPO_PUBLIC_SUPABASE_URL=https://<tu-proyecto>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=<clave-sdk-cliente>
```

Las siguientes variables solo existen en las Edge Functions de Supabase (nunca en el cliente):

```
SUPABASE_SERVICE_ROLE_KEY
GOOGLE_DIRECTIONS_API_KEY
FIREBASE_SERVER_KEY
```

### Instalación

```bash
# Clonar el repositorio
git clone https://github.com/Diego31-10/TecniBus.git
cd TecniBus

# Instalar dependencias
npm install

# Iniciar el servidor de desarrollo
npx expo start
```

### Ejecutar las Migraciones de Base de Datos

```bash
# Con Supabase CLI instalado y proyecto vinculado
supabase db push
```

### Desplegar las Edge Functions

```bash
supabase functions deploy generate-attendance-report
supabase functions deploy import-entities
supabase functions deploy broadcast-anuncio
supabase functions deploy crear-usuario
supabase functions deploy eliminar-usuario
supabase functions deploy get-directions
supabase functions deploy notificar-asistencia
supabase functions deploy send-push-notification
```

---

## Estructura del Proyecto

```
TecniBus/
├── app/                        # Pantallas (Expo Router, file-based routing)
│   ├── _layout.tsx             # Layout raíz y proveedor de autenticación
│   ├── login.tsx               # Pantalla de inicio de sesión
│   ├── index.tsx               # Redirección según rol
│   ├── admin/                  # Pantallas del administrador
│   │   ├── index.tsx           # Dashboard del administrador
│   │   ├── estudiantes/        # Gestión de estudiantes
│   │   ├── rutas/              # Gestión de rutas
│   │   ├── choferes/           # Gestión de conductores
│   │   ├── busetas/            # Gestión de buses
│   │   ├── padres/             # Gestión de padres
│   │   ├── asignaciones.tsx    # Asignaciones conductor–ruta–bus
│   │   ├── anuncios.tsx        # Envío de anuncios
│   │   └── configuracion.tsx   # Configuración general
│   ├── driver/                 # Pantallas del conductor
│   │   ├── index.tsx           # Dashboard del conductor
│   │   ├── chat.tsx            # Chat con padres
│   │   ├── perfil.tsx          # Perfil del conductor
│   │   └── settings.tsx        # Configuración
│   └── parent/                 # Pantallas del padre de familia
│       ├── index.tsx           # Dashboard y seguimiento en tiempo real
│       ├── chat.tsx            # Chat con el conductor
│       ├── perfil.tsx          # Perfil del padre
│       └── settings.tsx        # Configuración
├── features/                   # Componentes específicos por rol
│   ├── admin/                  # Componentes del administrador
│   ├── driver/                 # Componentes del conductor
│   └── parent/                 # Componentes del padre
├── components/                 # Componentes de UI reutilizables
├── contexts/                   # Contextos de React (AuthContext, etc.)
├── lib/                        # Utilidades, servicios y constantes
│   ├── constants/              # Colores, mensajes rápidos, etc.
│   └── services/               # Servicios de Supabase (chat, tracking, etc.)
├── supabase/
│   ├── functions/              # Edge Functions (Deno)
│   └── migrations/             # Migraciones de la base de datos SQL
├── assets/                     # Imágenes, íconos y fuentes
├── .env.example                # Plantilla de variables de entorno
└── package.json
```

---

## Base de Datos

El esquema de base de datos está gestionado mediante migraciones SQL en `supabase/migrations/`. Las tablas principales incluyen:

| Tabla | Descripción |
|---|---|
| `profiles` | Perfil de usuario con rol (admin, chofer, padre) |
| `estudiantes` | Datos de los estudiantes |
| `rutas` | Definición de rutas |
| `paradas` | Paraderos asociados a rutas |
| `asignaciones` | Asignación de conductor + bus + ruta por día |
| `recorridos` | Instancias de recorridos (inicio/fin) |
| `asistencias` | Registro de asistencia por estudiante y recorrido |
| `ubicaciones_bus` | Posiciones GPS del bus en tiempo real |
| `push_tokens` | Tokens FCM de los dispositivos |
| `chats` | Sesiones de chat padre–conductor |
| `mensajes` | Mensajes individuales de chat |
| `configuracion_colegio` | Parámetros generales de la institución |

Todas las tablas tienen habilitado **Row Level Security (RLS)**. Las operaciones privilegiadas se realizan mediante RPCs con `SECURITY DEFINER`.

---

## Edge Functions (Supabase)

| Función | Descripción |
|---|---|
| `generate-attendance-report` | Genera el PDF de asistencia y devuelve una URL firmada |
| `import-entities` | Importa masivamente padres, conductores, estudiantes o buses desde CSV |
| `broadcast-anuncio` | Envía un anuncio a todos los usuarios de la plataforma |
| `crear-usuario` | Crea un nuevo usuario en Supabase Auth con datos de perfil |
| `eliminar-usuario` | Elimina un usuario de Auth y su perfil asociado |
| `get-directions` | Obtiene la polilínea de una ruta usando la API de Google Directions |
| `notificar-asistencia` | Envía notificación push al padre cuando se registra la asistencia |
| `send-push-notification` | Función base para envío de notificaciones FCM |

---

## Contexto Académico

TecniBus fue desarrollado como Proyecto Integrador Técnico para el Bachillerato Técnico en Informática de la **Unidad Educativa Técnico Salesiano (UETS)**, Ecuador, 2025–2026. El proyecto se centra en arquitectura de nivel productivo, resolución de problemas reales e ingeniería de software aplicada, incluyendo diseño seguro de APIs, modelado de datos relacional y desarrollo móvil multiplataforma.

---

*Esta es la documentación oficial de TecniBus.*  
*Para la versión en español: [DOCS (ES)](DOCS-(ES)) · Para la versión en inglés: [DOCS (EN)](DOCS-(EN))*
