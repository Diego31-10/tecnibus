<div align="center">

<img src="https://readme-typing-svg.demolab.com?font=Fira+Code&size=45&pause=5000&color=F70A8D&center=true&vCenter=true&width=500&height=60&lines=TECNIBUS" alt="TecniBus" />
  
  <br />

  <img src="https://readme-typing-svg.demolab.com?font=Fira+Code&size=25&pause=5000&color=FFFFFF&center=true&vCenter=true&width=500&height=40&lines=Proyecto+Integrador+UETS" alt="Proyecto" />

<br/>

<img src="https://img.shields.io/badge/Estado-En%20Desarrollo%20Avanzado-f70a8d?style=for-the-badge" />
<img src="https://img.shields.io/badge/Expo-SDK%2052-000000?style=for-the-badge&logo=expo&logoColor=white" />
<img src="https://img.shields.io/badge/Supabase-Backend-3ecf8e?style=for-the-badge&logo=supabase&logoColor=white" />
<br/>
<img src="https://img.shields.io/badge/TypeScript-Strict-3178c6?style=for-the-badge&logo=typescript&logoColor=white" />
<img src="https://img.shields.io/badge/Google%20Maps-Integrado-4285F4?style=for-the-badge&logo=googlemaps&logoColor=white" />
<img src="https://img.shields.io/badge/Ámbito-UETS%20Institucional-00519b?style=for-the-badge" />

</div>

---

## 🚌 Sobre el proyecto

**TecniBus** es una aplicación móvil institucional desarrollada como **Proyecto Integrador de Bachillerato Técnico** en la Unidad Educativa Técnico Salesiano (UETS).

Permite la gestión completa del transporte escolar: el **administrador** organiza rutas y usuarios, el **chofer** conduce con navegación asistida y tracking GPS en tiempo real, y los **padres** siguen a la buseta desde su celular con ETAs precisos y actualizaciones al instante.

> Proyecto sin fines comerciales · Uso exclusivamente educativo · UETS Ecuador

---

## 📊 Avance del proyecto

```
Frontend   ████████████████████░░  92%
Backend    ███████████████████░░░░  85%
Base Datos ████████████████████░░  90%
```

---

## 👥 Roles del sistema

### 🛠️ Administrador
Panel de control completo para gestionar toda la operación:
- Gestión de usuarios: padres, choferes y estudiantes (CRUD)
- Administración de busetas y asignación chofer↔buseta
- Creación y edición de rutas con mapa interactivo
- Optimización automática de rutas con Google Directions API
- Gestión de paradas con geolocalización (lat/lng, orden, nombre)
- Estadísticas en tiempo real del sistema

### 🚌 Chofer
Dashboard operativo para conducir con toda la información necesaria:
- Visualización de ruta optimizada en mapa con polyline
- Tracking GPS en tiempo real (heading, velocidad, posición)
- Lista de estudiantes pendientes con estado de asistencia
- Geocercas automáticas: detecta llegada a cada parada
- ETAs calculados con Google Directions (parada por parada)
- Marcar estudiantes ausentes · Notificaciones push a padres al acercarse
- Iniciar/Finalizar recorrido · Navegación directa a Google Maps

### 👨‍👩‍👧 Padre de familia
Seguimiento completo del transporte de sus hijos:
- Mapa en tiempo real con posición exacta de la buseta
- ETAs precisos y actualizados (Google Directions vía DB)
- Timeline del recorrido: inicio → paradas → colegio
- Badge de llegada estimada a la parada del hijo
- Estado del recorrido: activo / inactivo
- Marcar ausencia del estudiante · Soporte multi-estudiante
- Nombre del chofer e indicador de conexión en vivo

---

## 🧱 Stack tecnológico

### 📱 Frontend
| Tecnología | Versión | Uso |
|---|---|---|
| React Native | — | Framework base |
| Expo | SDK 52 | Build, OTA, herramientas |
| TypeScript | Strict | Tipado estático completo |
| Expo Router | v3 | Navegación file-based |
| NativeWind | v4 | Tailwind CSS para RN |
| react-native-maps | — | Mapas interactivos |
| expo-location | — | GPS del dispositivo |
| react-native-reanimated | — | Animaciones fluidas |
| lucide-react-native | — | Iconografía |

### ☁️ Backend
| Tecnología | Uso |
|---|---|
| Supabase | BaaS completo |
| PostgreSQL | Base de datos relacional |
| Supabase Auth | Autenticación email/password |
| Row Level Security | Seguridad a nivel de fila |
| Edge Functions (Deno) | Operaciones sensibles server-side |
| Supabase Realtime | Cambios en tiempo real vía WebSocket |

### 🗺️ APIs externas
| API | Uso |
|---|---|
| Google Directions API | Optimización de rutas y cálculo de ETAs |
| Google Maps SDK | Renderizado de mapas nativos |

---

## 🗄️ Esquema de base de datos

```
profiles          → Datos base de todos los usuarios (nombre, rol)
padres            → Extensión de profiles para padres
choferes          → Extensión de profiles para choferes (licencia, buseta)
estudiantes       → Vinculados a padre y parada
busetas           → Flota de vehículos (placa, capacidad, modelo)
rutas             → Rutas con tipo (ida/vuelta) y horarios
paradas           → Puntos GPS de cada ruta (lat, lng, orden, nombre)
asignaciones_ruta → Asignación chofer↔ruta con polyline optimizado
estados_recorrido → Estado en tiempo real: activo, hora_inicio, eta_paradas
ubicaciones       → Historial GPS del bus (lat, lng, heading, velocidad)
asistencias       → Registro diario de asistencia por estudiante
configuracion     → Ajustes globales (ubicación del colegio, etc.)
```

> Todas las tablas cuentan con **RLS habilitado**. Las operaciones sensibles se realizan mediante Edge Functions con `service_role_key` en servidor.

---

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────┐
│                 App Móvil (Expo)                 │
│  ┌──────────┐  ┌──────────┐  ┌───────────────┐  │
│  │  Admin   │  │  Chofer  │  │     Padre     │  │
│  │ Dashboard│  │Dashboard │  │   Dashboard   │  │
│  └────┬─────┘  └────┬─────┘  └──────┬────────┘  │
│       └─────────────┼───────────────┘           │
│              Supabase Client JS                  │
└─────────────────────┬───────────────────────────┘
                       │ HTTPS / WebSocket
┌─────────────────────▼───────────────────────────┐
│                  Supabase                        │
│  ┌─────────────┐  ┌────────────┐  ┌──────────┐  │
│  │  PostgreSQL │  │  Realtime  │  │  Edge    │  │
│  │  + RLS      │  │  (WS)      │  │Functions │  │
│  └─────────────┘  └────────────┘  └──────────┘  │
└─────────────────────────────────────────────────┘
                       │
┌─────────────────────▼───────────────────────────┐
│            Google Directions API                 │
│   Optimización de rutas · ETAs en tiempo real   │
└─────────────────────────────────────────────────┘
```

**Flujo de ETAs en tiempo real:**
1. Chofer se mueve → GPS actualiza posición cada 5s
2. Driver calcula ETAs con Google Directions (todos los waypoints en 1 llamada)
3. ETAs se publican en `estados_recorrido.eta_paradas` (JSONB)
4. Padre lee ETAs vía RPC `SECURITY DEFINER` → sin problemas de RLS
5. Polling cada 10s + Realtime como refuerzo garantizan actualización

---

## 📁 Estructura del proyecto

```
tecnibus/
├── app/                        # Pantallas (Expo Router)
│   ├── _layout.tsx             # Root layout + AuthProvider
│   ├── login.tsx               # Autenticación
│   ├── admin/                  # Panel administrador
│   │   ├── index.tsx           # Dashboard con estadísticas
│   │   ├── choferes/           # CRUD choferes
│   │   ├── padres/             # CRUD padres
│   │   ├── estudiantes/        # CRUD estudiantes
│   │   ├── busetas/            # Gestión de flota
│   │   └── rutas/              # Rutas con mapa interactivo
│   ├── driver/
│   │   └── index.tsx           # Dashboard del chofer
│   └── parent/
│       └── index.tsx           # Dashboard del padre
│
├── lib/
│   ├── contexts/
│   │   └── AuthContext.tsx     # Estado global de autenticación
│   ├── services/
│   │   ├── supabase.ts         # Cliente Supabase
│   │   ├── geocercas.service.ts# ETAs + geofencing
│   │   ├── directions.service.ts# Google Directions API
│   │   ├── recorridos.service.ts# Inicio/fin de recorridos
│   │   └── ...                 # Otros servicios
│   └── types/
│       └── database.types.ts   # Tipos generados desde Supabase
│
├── components/                 # Componentes compartidos
├── features/                   # Módulos por rol (admin/driver/parent)
└── supabase/
    ├── functions/              # Edge Functions (Deno)
    └── migrations/             # Historial de migraciones SQL
```

---

## 🔐 Seguridad

- **RLS activo** en todas las tablas — cada rol solo accede a sus datos
- **Edge Functions** para operaciones con `service_role_key` (nunca expuesta al cliente)
- **RPCs `SECURITY DEFINER`** para consultas que requieren bypass controlado de RLS
- **Validación** en cliente y servidor con TypeScript strict
- **Tokens y secrets** exclusivamente en variables de entorno

---

## 🚀 Funcionalidades completadas

### Admin
- [x] Autenticación y persistencia de sesión
- [x] Dashboard con estadísticas en tiempo real
- [x] CRUD de padres, choferes y estudiantes
- [x] Gestión de busetas
- [x] Creación de rutas con mapa interactivo
- [x] Optimización de rutas (Google Directions)
- [x] Asignación chofer↔buseta↔ruta
- [x] Configuración de ubicación del colegio

### Chofer
- [x] Dashboard operativo con mapa
- [x] Tracking GPS en tiempo real
- [x] Geocercas por parada
- [x] ETAs con Google Directions
- [x] Lista de estudiantes + control de asistencia
- [x] Inicio/fin de recorrido
- [x] Push notifications a padres al acercarse
- [x] Navegación a Google Maps

### Padre
- [x] Mapa en tiempo real con posición de la buseta
- [x] ETAs precisos (DB-driven, Google Directions)
- [x] Timeline del recorrido con paradas
- [x] Badge de llegada estimada
- [x] Marcar ausencia del estudiante
- [x] Multi-estudiante
- [x] Nombre del chofer e indicador online

## ⏳ Pendiente

- [ ] Chat chofer ↔ padre
- [ ] Notificaciones push (anuncios del admin)
- [ ] Historial de recorridos
- [ ] Reportes y analytics

---

## ⚖️ Licencia

Este proyecto está bajo la Licencia MIT - mira el archivo [LICENSE](LICENSE) para detalles.

Copyright (c) 2026 - Diego Torres - TecniBus

---

<div align="center">

**TecniBus** · Proyecto Integrador · Bachillerato Técnico en Informática  
Unidad Educativa Técnico Salesiano (UETS) · Ecuador · 2025–2026

</div>
