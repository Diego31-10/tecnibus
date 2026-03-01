<img src="https://readme-typing-svg.demolab.com?font=Fira+Code&amp;size=45&amp;pause=5000&amp;color=F70A8D&amp;center=true&amp;vCenter=true&amp;width=500&amp;height=60&amp;lines=TECNIBUS">
  
<br>

<img src="https://readme-typing-svg.demolab.com?font=Fira+Code&amp;size=25&amp;pause=5000&amp;color=FFFFFF&amp;center=true&amp;vCenter=true&amp;width=500&amp;height=40&amp;lines=Proyecto+Integrador+UETS">

---

## Project Overview

**TecniBus** is a full-stack mobile application for school transportation management. It provides real-time GPS tracking, route optimization, attendance control, and push notifications in a single platform.

The system addresses the lack of visibility and coordination in school bus operations. Parents have no reliable way to know where the bus is or when it will arrive; administrators manage routes and rosters manually; drivers operate without digital tools. TecniBus solves all three problems in a unified, role-aware application.

**Target users:**

- **Administrators** — manage routes, users, vehicles, and view system-wide data.
- **Drivers** — navigate optimized routes, track attendance, and trigger parent notifications.
- **Parents** — monitor the bus in real time and receive arrival estimates for their children's stop.

---

## Key Features

- **Real-time bus tracking** — live GPS position broadcast via Supabase Realtime (WebSocket).
- **Route management with Google Maps** — interactive route builder with stop sequencing and polyline rendering.
- **Attendance tracking** — per-stop student check-in with absence marking and trip-level records.
- **PDF attendance reports** — generated server-side inside Supabase Edge Functions; never exposed as client logic.
- **Role-based dashboards** — fully separated UI and data access for admin, driver, and parent roles.
- **Secure backend architecture** — Row Level Security on every table; sensitive operations isolated in Edge Functions.
- **CSV/JSON bulk import** — import students, stops, and routes in bulk without manual entry.
- **Firebase push notifications** — FCM integration for real-time alerts when the bus approaches a stop.

---

## System Architecture

TecniBus follows a strict client/backend separation. The mobile client handles UI and user interaction; all privileged operations execute on the server.

- **Expo (React Native)** — cross-platform mobile client built with SDK 52, Expo Router for file-based navigation, and NativeWind for styling.
- **Supabase** — serves as the complete backend: PostgreSQL for relational data, Supabase Auth for email/password authentication, Edge Functions (Deno runtime) for server-side logic, Supabase Storage for report files, and Realtime for WebSocket subscriptions.
- **Google Maps SDK + Directions API** — the Maps SDK runs on the client for map rendering; the Directions API is called exclusively from Edge Functions, keeping the API key out of the client bundle.
- **Firebase (FCM)** — used solely for push notification delivery. No Firebase database or hosting is used.

Client code never holds privileged credentials. The `service_role_key` and server-side API keys exist only within Edge Function environment variables.

---

## Security & Best Practices

- **API key separation** — the Google Maps SDK key (client) and the Directions API key (server) are distinct credentials with different restrictions. The Directions key is never shipped in the app bundle.
- **Server-side PDF generation** — attendance reports are generated and stored inside Edge Functions. Clients receive a signed URL with a limited validity window.
- **Role-based authorization** — Row Level Security policies on every table enforce that each role can only read or write its own data. No client-side access control is trusted without a server-side check.
- **Signed URLs for reports** — PDF files stored in Supabase Storage are served through time-limited signed URLs, preventing unauthorized access.
- **Environment secrets management** — all secrets are stored as environment variables in Supabase Edge Function config or in `.env` files excluded from version control. No secret is hardcoded.

---

## Tech Stack

**Frontend**

- React Native (Expo SDK 52)
- TypeScript (strict mode)
- Expo Router v3
- NativeWind v4 (Tailwind CSS for React Native)
- react-native-maps
- expo-location
- react-native-reanimated
- lucide-react-native

**Backend**

- Supabase (PostgreSQL, Auth, Realtime, Storage)
- Edge Functions (Deno runtime)
- Row Level Security
- `SECURITY DEFINER` RPC functions

**Infrastructure**

- Supabase Cloud
- Expo EAS (build and OTA updates)
- Firebase Cloud Messaging (FCM)

**External Services**

- Google Maps SDK (map rendering)
- Google Directions API (route optimization and ETA calculation)

---

## Screenshots (Future)

Screenshots will be added as the project reaches stable UI milestones.

**Admin Dashboard**

![Admin Dashboard](.github/screenshots/admin-dashboard.png)
![Route Builder](.github/screenshots/admin-route-builder.png)
![User Management](.github/screenshots/admin-users.png)

**Driver Interface**

![Driver Map](.github/screenshots/driver-map.png)
![Attendance List](.github/screenshots/driver-attendance.png)

**Parent Interface**

![Parent Tracking](.github/screenshots/parent-tracking.png)
![Stop ETA](.github/screenshots/parent-eta.png)

**Reports & Analytics**

![Attendance Report PDF](.github/screenshots/report-pdf.png)
![Analytics Overview](.github/screenshots/analytics.png)

---

## Installation & Setup

### Requirements

- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- Supabase CLI (`npm install -g supabase`)
- A Supabase project
- A Firebase project with FCM enabled
- Google Cloud project with Maps SDK and Directions API enabled

### Environment Variables

Copy `.env.example` to `.env` and fill in the required values:

```
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_GOOGLE_MAPS_KEY=
```

Edge Function secrets (set via `supabase secrets set`):

```
GOOGLE_DIRECTIONS_KEY=
SUPABASE_SERVICE_ROLE_KEY=
FIREBASE_SERVER_KEY=
```

### Supabase Setup

```bash
supabase login
supabase link --project-ref <your-project-ref>
supabase db push
```

### Running Locally

```bash
npm install
npx expo start
```

### Deploying Edge Functions

```bash
supabase functions deploy generate-report
supabase functions deploy send-notification
```

---

## Academic Context

TecniBus was developed as the Integrative Technical Project (Proyecto Integrador) required for the Technical Baccalaureate in Computer Science at Unidad Educativa Técnico Salesiano (UETS), Ecuador, 2025–2026. The project emphasizes production-level architecture, real-world problem solving, and the application of software engineering principles — including secure API design, relational data modeling, and mobile development — in an institutional context.

---

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

Copyright (c) 2026 Diego Torres — TecniBus
