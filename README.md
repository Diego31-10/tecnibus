<div align="center">

<img src="https://readme-typing-svg.demolab.com?font=Fira+Code&amp;size=45&amp;pause=5000&amp;color=F70A8D&amp;center=true&amp;vCenter=true&amp;width=500&amp;height=60&amp;lines=TECNIBUS">

<br>

<img src="https://readme-typing-svg.demolab.com?font=Fira+Code&amp;size=25&amp;pause=5000&amp;color=FFFFFF&amp;center=true&amp;vCenter=true&amp;width=500&amp;height=40&amp;lines=Proyecto+Integrador+UETS">

<br><br>

<img src="https://img.shields.io/badge/Expo-SDK%2052-000000?style=flat-square&logo=expo&logoColor=white" />
<img src="https://img.shields.io/badge/Supabase-Backend-3ecf8e?style=flat-square&logo=supabase&logoColor=white" />
<img src="https://img.shields.io/badge/TypeScript-Strict-3178c6?style=flat-square&logo=typescript&logoColor=white" />
<img src="https://img.shields.io/badge/Google%20Maps-Integrated-4285F4?style=flat-square&logo=googlemaps&logoColor=white" />
<img src="https://img.shields.io/badge/Firebase-FCM-FFCA28?style=flat-square&logo=firebase&logoColor=black" />
<img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" />

</div>

---

## Project Overview

**TecniBus** is a full-stack mobile application for institutional school transportation management. It provides real-time GPS tracking, route optimization, attendance control, and push notifications in a single role-aware platform.

**Roles:** Administrators · Drivers · Parents

---

## Problem & Solution

School bus operations lack digital coordination. Parents cannot reliably track bus location or estimate arrival time. Administrators manage routes and rosters manually. Drivers operate without digital tools or attendance records.

TecniBus addresses all three pain points through a unified mobile application with role-specific dashboards, a secure Supabase backend, and real-time data synchronization.

---

## Core Features

- **Real-time bus tracking** — live GPS position broadcast via Supabase Realtime (WebSocket).
- **Route management** — interactive route builder with Google Maps, stop sequencing, and polyline rendering.
- **Attendance tracking** — per-stop student check-in, absence marking, and trip-level records.
- **PDF attendance reports** — generated server-side in Edge Functions and served via signed URLs.
- **Role-based dashboards** — fully separated UI and data access for each role.
- **Secure backend architecture** — Row Level Security on every table; privileged operations isolated in Edge Functions.
- **CSV/JSON bulk import** — bulk-load students, stops, and routes without manual entry.
- **Firebase push notifications** — FCM alerts sent when the bus approaches a stop.

---

## 🏗 System Architecture

The mobile client handles UI and user interaction only. All privileged operations execute server-side.

- **Expo (React Native)** — cross-platform client with SDK 52, Expo Router (file-based navigation), and NativeWind for styling.
- **Supabase** — complete backend: PostgreSQL, Auth (email/password), Edge Functions (Deno), Storage, and Realtime (WebSocket).
- **Google Maps SDK + Directions API** — Maps SDK runs on the client for rendering; Directions API is called exclusively from Edge Functions, keeping the key out of the app bundle.
- **Firebase (FCM only)** — push notification delivery. No Firebase database or hosting.

The `service_role_key` and all server-side API keys exist only within Edge Function environment variables and are never shipped to the client.

---

## 🔐 Security & Best Practices

- **API key separation** — Google Maps SDK key (client, restricted) and Directions API key (server only) are distinct credentials. The Directions key is never included in the app bundle.
- **Server-side PDF generation** — reports are created and stored inside Edge Functions. Clients receive time-limited signed URLs.
- **Row Level Security** — enforced on every table. No role can read or write data beyond its scope.
- **Signed URLs** — report files in Supabase Storage are only accessible via expiring signed URLs.
- **Secrets management** — all credentials live in environment variables or Supabase Edge Function secrets. Nothing is hardcoded.

---

## Tech Stack

**Frontend**
- React Native · Expo SDK 52 · TypeScript (strict)
- Expo Router v3 · NativeWind v4
- react-native-maps · expo-location · react-native-reanimated

**Backend**
- Supabase (PostgreSQL, Auth, Realtime, Storage)
- Edge Functions (Deno) · Row Level Security · `SECURITY DEFINER` RPCs

**Infrastructure**
- Supabase Cloud · Expo EAS · Firebase Cloud Messaging

**External Services**
- Google Maps SDK · Google Directions API

---

## 📸 Screenshots

> Screenshots will be added as the project reaches stable UI milestones.

**🛠 Admin Dashboard**

![Admin Dashboard](.github/screenshots/admin-dashboard.png)
![Route Builder](.github/screenshots/admin-route-builder.png)
![User Management](.github/screenshots/admin-users.png)

**🚌 Driver Interface**

![Driver Map](.github/screenshots/driver-map.png)
![Attendance List](.github/screenshots/driver-attendance.png)

**👨‍👩‍👧 Parent App**

![Parent Tracking](.github/screenshots/parent-tracking.png)
![Stop ETA](.github/screenshots/parent-eta.png)

**📊 Reports & Analytics**

![Attendance Report PDF](.github/screenshots/report-pdf.png)
![Analytics Overview](.github/screenshots/analytics.png)

---

## Academic Context

TecniBus was developed as the Integrative Technical Project (Proyecto Integrador) for the Technical Baccalaureate in Computer Science at Unidad Educativa Técnico Salesiano (UETS), Ecuador, 2025–2026. The project focuses on production-level architecture, real-world problem solving, and applied software engineering — including secure API design, relational data modeling, and cross-platform mobile development.

---

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

Copyright (c) 2026 Diego Torres — TecniBus
