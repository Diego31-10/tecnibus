# TecniBus — Official Documentation (EN)

> Official technical and functional documentation for the TecniBus project.  
> For the Spanish version, see [DOCS (ES)](DOCS-(ES)).

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [System Architecture](#system-architecture)
3. [Roles and Permissions](#roles-and-permissions)
4. [Core Features](#core-features)
   - [Real-Time GPS Tracking](#real-time-gps-tracking)
   - [Route Management](#route-management)
   - [Attendance Tracking](#attendance-tracking)
   - [Attendance Report PDF Export](#attendance-report-pdf-export)
   - [Parent–Driver Chat](#parentdriver-chat)
   - [CSV Bulk Import](#csv-bulk-import)
   - [Push Notifications](#push-notifications)
5. [Tech Stack](#tech-stack)
6. [Security](#security)
7. [Environment Setup](#environment-setup)
8. [Project Structure](#project-structure)
9. [Database](#database)
10. [Edge Functions (Supabase)](#edge-functions-supabase)
11. [Academic Context](#academic-context)

---

## Project Overview

**TecniBus** is a cross-platform mobile application for comprehensive institutional school transportation management. It unifies real-time GPS tracking, route management, attendance control, direct communication between parents and drivers, and automated report generation in a single role-aware platform.

**Roles:** Administrator · Driver · Parent

---

## System Architecture

The mobile client handles UI and user interaction only. All privileged operations execute server-side.

| Layer | Technology | Responsibility |
|---|---|---|
| Client | Expo (React Native) + TypeScript | UI, navigation, user interaction |
| Backend | Supabase (PostgreSQL + Auth + Realtime + Storage) | Data, authentication, real-time sync |
| Edge Functions | Deno (Supabase) | PDF, CSV import, notifications, routing |
| Maps | Google Maps SDK (client) + Directions API (server) | Map rendering and route calculation |
| Notifications | Firebase Cloud Messaging (FCM) | Stop proximity alerts |

> The `service_role_key` and all server-side API keys reside exclusively in Edge Function environment variables and are never shipped in the application bundle.

---

## Roles and Permissions

### Administrator
- Manage users (administrators, drivers, parents, students).
- Create, edit, and delete routes and stops.
- Assign drivers and buses to routes.
- View and export attendance reports as PDF.
- Bulk-import data via CSV files.
- Broadcast announcements to all users.

### Driver
- View assigned routes and stops for the day.
- Start and end trips.
- Mark student attendance at each stop.
- See the real-time location of the bus on the map.
- Chat with parents during an active trip.

### Parent
- Track the bus location in real time.
- View the estimated time of arrival (ETA) at the stop.
- Review the attendance history for their child.
- Chat with the assigned bus driver during an active trip.
- Receive push notifications when the bus approaches the stop.

---

## Core Features

### Real-Time GPS Tracking

The driver broadcasts their GPS position using `expo-location`. The location is stored in Supabase and distributed to subscribed clients via **Supabase Realtime (WebSocket)**.

- **Driver:** position is saved periodically during an active trip.
- **Parent:** subscribes to the real-time channel and sees the bus position updated on the map.
- **ETA:** calculated using geofences and the Directions API (called from an Edge Function).

### Route Management

- Interactive route builder with Google Maps.
- Stop sequencing with drag-and-drop.
- Route polyline rendering on the map.
- Assignment of drivers and buses to routes.
- Support for configurable service days.

### Attendance Tracking

- Per-stop student attendance recording during the trip.
- Present/absent marking per student.
- Check-in timestamp logging.
- Attendance history accessible by both the parent and the administrator.
- Real-time synchronization via Supabase Realtime.

### Attendance Report PDF Export

Attendance reports are generated **entirely server-side** by a Supabase Edge Function.

**Flow:**
1. The administrator requests a report from the application.
2. The `generate-attendance-report` Edge Function queries the database, generates the PDF, and stores it in **Supabase Storage** (bucket `reportes`).
3. A **time-limited signed URL** is returned to the client.
4. The client opens or downloads the PDF from that URL.

> Report files are never publicly accessible; they can only be retrieved via expiring signed URLs.

### Parent–Driver Chat

Direct real-time messaging between a parent and the assigned bus driver, available **only during an active trip**.

**Features:**
- Real-time messages via **Supabase Realtime**.
- **Predefined quick messages** for common responses.
- Unread message indicator in the conversation list.
- **Read-only mode** once the trip has ended.
- Parents can start the conversation from the tracking screen.
- Drivers can view and reply to all parents on their active route.

**Flow — Parent:**
1. Go to the trip tracking screen.
2. Tap the chat button to open the conversation with the driver.
3. Send a free-text message or select a quick message.
4. Messages are visible to the driver in real time.

**Flow — Driver:**
1. Go to the **Chats** section from the driver menu.
2. Select the conversation with the desired parent.
3. Send a free-text message or select a quick message.
4. Messages are visible to the parent in real time.

### CSV Bulk Import

Allows loading multiple records at once without manual data entry, via the `import-entities` Edge Function.

**Supported entities:**
- `padres` — Parents
- `conductores` — Drivers
- `estudiantes` — Students
- `buses` — Buses

**File format:**
- Type: CSV (comma-separated)
- Maximum size: 2 MB
- Maximum rows: 1,000 per import
- Encoding: UTF-8

**Process:**
1. From the admin panel, go to **Import Data**.
2. Select the entity to import (parents, drivers, students, or buses).
3. Upload the CSV file in the required format.
4. The Edge Function validates each row, creates accounts in Supabase Auth, and saves the data.
5. A summary is returned with the total rows processed, successfully inserted, and any errors found.

> Imports with errors are partial: valid rows are inserted and erroneous rows are reported with the row number and a description of the problem.

### Push Notifications

Notifications are delivered via **Firebase Cloud Messaging (FCM)**.

- **Proximity alert:** a parent receives a notification when the bus enters the geofence of their stop.
- **Announcements:** the administrator can send general messages to all users via the `broadcast-anuncio` Edge Function.
- Device tokens are managed through the `push_tokens` table in Supabase.

---

## Tech Stack

### Frontend
| Technology | Version | Usage |
|---|---|---|
| React Native | 0.81.5 | Cross-platform mobile framework |
| Expo SDK | 54 | Native tools and APIs |
| TypeScript | ~5.9 (strict) | Static typing |
| Expo Router v6 | ~6.0 | File-based navigation |
| NativeWind v4 | ^4.2 | Tailwind CSS styling |
| react-native-maps | 1.20.1 | Maps and markers |
| expo-location | ~19.0 | Device GPS |
| react-native-reanimated | ~4.1 | Smooth animations |

### Backend
| Technology | Usage |
|---|---|
| Supabase (PostgreSQL) | Relational database |
| Supabase Auth | Email/password authentication |
| Supabase Realtime | Real-time sync (WebSocket) |
| Supabase Storage | File storage (PDFs) |
| Edge Functions (Deno) | Server-side business logic |
| Row Level Security | Row-level access control |

### Infrastructure & External Services
| Service | Usage |
|---|---|
| Supabase Cloud | Backend hosting |
| Expo EAS | App build and distribution |
| Firebase Cloud Messaging | Push notifications |
| Google Maps SDK | Map rendering (client) |
| Google Directions API | Route calculation (server only) |

---

## Security

- **API key separation:** the Google Maps SDK key (client-side, restricted by package) and the Directions API key (server-only) are distinct credentials. The Directions key is never included in the app bundle.
- **Server-side PDF generation:** reports are created and stored inside Edge Functions. Clients only receive expiring signed URLs.
- **Row Level Security (RLS):** enforced on every table. No role can read or write data beyond its scope.
- **Signed URLs:** report files in Supabase Storage are only accessible via expiring signed URLs.
- **Secrets management:** all credentials are managed via environment variables or Supabase Edge Function secrets. Nothing is hardcoded.
- **Chat restricted to active trips:** messages can only be sent while a trip is in progress, preventing unauthorized communication.

---

## Environment Setup

### Prerequisites

- Node.js ≥ 18
- Expo CLI (`npm install -g expo-cli`)
- Supabase account with a configured project
- Firebase account (for FCM)
- Google Maps keys (SDK key for client; Directions API key for server)

### Environment Variables

Copy `.env.example` to `.env` in the project root and fill in the values:

```env
EXPO_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=<client-sdk-key>
```

The following variables exist only in Supabase Edge Functions (never on the client):

```
SUPABASE_SERVICE_ROLE_KEY
GOOGLE_DIRECTIONS_API_KEY
FIREBASE_SERVER_KEY
```

### Installation

```bash
# Clone the repository
git clone https://github.com/Diego31-10/TecniBus.git
cd TecniBus

# Install dependencies
npm install

# Start the development server
npx expo start
```

### Run Database Migrations

```bash
# With Supabase CLI installed and project linked
supabase db push
```

### Deploy Edge Functions

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

## Project Structure

```
TecniBus/
├── app/                        # Screens (Expo Router, file-based routing)
│   ├── _layout.tsx             # Root layout and auth provider
│   ├── login.tsx               # Login screen
│   ├── index.tsx               # Role-based redirect
│   ├── admin/                  # Administrator screens
│   │   ├── index.tsx           # Admin dashboard
│   │   ├── estudiantes/        # Student management
│   │   ├── rutas/              # Route management
│   │   ├── choferes/           # Driver management
│   │   ├── busetas/            # Bus management
│   │   ├── padres/             # Parent management
│   │   ├── asignaciones.tsx    # Driver–route–bus assignments
│   │   ├── anuncios.tsx        # Broadcast announcements
│   │   └── configuracion.tsx   # General settings
│   ├── driver/                 # Driver screens
│   │   ├── index.tsx           # Driver dashboard
│   │   ├── chat.tsx            # Chat with parents
│   │   ├── perfil.tsx          # Driver profile
│   │   └── settings.tsx        # Settings
│   └── parent/                 # Parent screens
│       ├── index.tsx           # Dashboard and real-time tracking
│       ├── chat.tsx            # Chat with the driver
│       ├── perfil.tsx          # Parent profile
│       └── settings.tsx        # Settings
├── features/                   # Role-specific UI components
│   ├── admin/                  # Admin components
│   ├── driver/                 # Driver components
│   └── parent/                 # Parent components
├── components/                 # Reusable UI components
├── contexts/                   # React contexts (AuthContext, etc.)
├── lib/                        # Utilities, services, and constants
│   ├── constants/              # Colors, quick messages, etc.
│   └── services/               # Supabase services (chat, tracking, etc.)
├── supabase/
│   ├── functions/              # Edge Functions (Deno)
│   └── migrations/             # SQL database migrations
├── assets/                     # Images, icons, and fonts
├── .env.example                # Environment variable template
└── package.json
```

---

## Database

The database schema is managed through SQL migrations in `supabase/migrations/`. The main tables include:

| Table | Description |
|---|---|
| `profiles` | User profile with role (admin, chofer, padre) |
| `estudiantes` | Student data |
| `rutas` | Route definitions |
| `paradas` | Stops associated with routes |
| `asignaciones` | Driver + bus + route assignment per day |
| `recorridos` | Trip instances (start/end) |
| `asistencias` | Per-student attendance records per trip |
| `ubicaciones_bus` | Real-time bus GPS positions |
| `push_tokens` | Device FCM tokens |
| `chats` | Parent–driver chat sessions |
| `mensajes` | Individual chat messages |
| `configuracion_colegio` | General institution settings |

All tables have **Row Level Security (RLS)** enabled. Privileged operations are performed through RPCs with `SECURITY DEFINER`.

---

## Edge Functions (Supabase)

| Function | Description |
|---|---|
| `generate-attendance-report` | Generates the attendance PDF and returns a signed URL |
| `import-entities` | Bulk-imports parents, drivers, students, or buses from CSV |
| `broadcast-anuncio` | Sends an announcement to all users on the platform |
| `crear-usuario` | Creates a new user in Supabase Auth with profile data |
| `eliminar-usuario` | Deletes a user from Auth and their associated profile |
| `get-directions` | Retrieves a route polyline using the Google Directions API |
| `notificar-asistencia` | Sends a push notification to the parent when attendance is recorded |
| `send-push-notification` | Base function for FCM notification delivery |

---

## Academic Context

TecniBus was developed as the Integrative Technical Project (Proyecto Integrador) for the Technical Baccalaureate in Computer Science at **Unidad Educativa Técnico Salesiano (UETS)**, Ecuador, 2025–2026. The project focuses on production-level architecture, real-world problem solving, and applied software engineering — including secure API design, relational data modeling, and cross-platform mobile development.

---

*This is the official documentation of TecniBus.*  
*For the Spanish version: [DOCS (ES)](DOCS-(ES)) · For the English version: [DOCS (EN)](DOCS-(EN))*
