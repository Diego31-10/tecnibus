# TecniBus

## 1. Descripción general del proyecto

**TecniBus** es una aplicación móvil orientada al monitoreo y gestión del transporte escolar, diseñada para mejorar la **seguridad**, **comunicación** y **organización** entre la institución educativa, los padres de familia y los conductores de las busetas escolares.

El sistema permite a los padres conocer el estado del transporte de sus hijos, a los choferes gestionar recorridos y a la institución mantener un control centralizado y seguro de toda la información relacionada con el transporte escolar.

TecniBus está planteado como un **sistema institucional**, no como una aplicación abierta al público.

---

## 2. Objetivo del sistema

### Objetivo general

Desarrollar una aplicación móvil que permita la **gestión y monitoreo seguro del transporte escolar**, garantizando control institucional, trazabilidad de la información y una comunicación clara entre los actores involucrados.

### Objetivos específicos

* Centralizar la gestión de usuarios relacionados con el transporte escolar.
* Permitir a los padres visualizar información relevante sobre el transporte de sus hijos.
* Facilitar a los choferes la gestión operativa del recorrido.
* Garantizar seguridad en el acceso y uso del sistema mediante autenticación y control de roles.
* Establecer una arquitectura escalable y defendible académicamente.

---

## 3. Alcance del proyecto

TecniBus se enfoca exclusivamente en el **transporte escolar institucional**. No contempla:

* Registro público de usuarios.
* Uso fuera del contexto de una institución educativa.
* Acceso libre o sin autorización previa.

Todas las cuentas son creadas y gestionadas por un **administrador institucional**.

---

## 4. Roles del sistema y permisos

El sistema maneja **roles estrictamente definidos**, cada uno con permisos específicos.

### 4.1 Administrador (admin)

Representa a la institución educativa.

Permisos:

* Crear y gestionar cuentas de usuarios.
* Registrar padres, choferes y busetas.
* Asignar relaciones entre entidades (padre–estudiante, chofer–buseta).
* Acceso total a la información del sistema.

Restricciones:

* El rol administrador no se crea desde la aplicación.
* Es creado manualmente por el desarrollador o desde el panel de Supabase.

---

### 4.2 Padre

Usuario responsable de uno o varios estudiantes.

Permisos:

* Visualizar información únicamente de sus estudiantes asociados.
* Consultar el estado del transporte.
* Marcar el estado de asistencia del estudiante (asiste / no asiste).

Restricciones:

* No puede ver información de otros estudiantes.
* No puede crear ni modificar otros usuarios.

---

### 4.3 Chofer

Usuario encargado de una buseta escolar.

Permisos:

* Visualizar información del recorrido asignado.
* Consultar la lista de estudiantes asignados a su buseta.
* Enviar información operativa (ubicación, estado del recorrido).

Restricciones:

* No puede acceder a información institucional completa.
* No puede gestionar usuarios.

---

## 5. Reglas de negocio

Las siguientes reglas son **obligatorias** y definen el funcionamiento del sistema:

1. No existe registro público de usuarios.
2. Todas las cuentas son creadas por el administrador.
3. Todo usuario debe tener un rol asignado.
4. Un padre solo puede visualizar a sus propios estudiantes.
5. Un chofer solo puede operar la buseta que le fue asignada.
6. El acceso a la información está controlado por roles y políticas de seguridad.
7. Toda acción sensible debe estar validada en backend.

Estas reglas garantizan un sistema seguro, controlado y coherente con el entorno escolar.

---

## 6. Stack tecnológico

### Frontend

* **React Native**
* **Expo**
* **TypeScript**
* **Expo Router** (file-based routing)
* **NativeWind (Tailwind CSS)**
* **lucide-react-native** (iconografía)
* **react-native-reanimated (animaciones) 

### Backend

* **Supabase**

  * Autenticación (Auth)
  * Base de datos PostgreSQL
  * Row Level Security (RLS)
  * Edge Functions

### Paleta de colores por rol

El sistema utiliza colores diferenciados para cada rol, mejorando la experiencia de usuario y facilitando la identificación visual del contexto:

- **Admin**: Verde (`#16a34a`, `admin-600` en Tailwind)
- **Padre**: Azul (`#2563eb`, `primary-600` en Tailwind)
- **Chofer**: Amarillo/Dorado (`#ca8a04`, `accent-600` en Tailwind)

Esta diferenciación cromática es consistente en:
- Headers de pantallas
- Botones de acción principal
- Indicadores de estado
- Iconografía contextual

---

## 7. Arquitectura general

TecniBus sigue una arquitectura **cliente–servidor**, donde:

* El frontend móvil se encarga de la experiencia de usuario.
* Supabase gestiona la autenticación, datos y seguridad.
* Las reglas críticas se validan en el backend.
* La ubicación del transporte se obtiene mediante el GPS integrado del dispositivo móvil del chofer, utilizando los permisos de localización del sistema operativo.

La lógica sensible **no depende únicamente del cliente**, garantizando mayor seguridad.

---

## 8. Estructura de carpetas (Frontend)

La aplicación utiliza **Expo Router**, basado en rutas por archivos.

Estructura general:

* `app/` → Pantallas y navegación
* `components/` → Componentes reutilizables
* `lib/` → Configuración de servicios (Supabase, helpers)
* `hooks/` → Hooks personalizados
* `types/` → Tipos y definiciones globales

Esta organización favorece la escalabilidad y el mantenimiento.

---

## 9. Convenciones de código y estilo

* Uso estricto de TypeScript.
* Componentes funcionales.
* Nombres descriptivos y consistentes.
* Separación clara entre UI y lógica.
* Uso de estilos mediante clases Tailwind (NativeWind).
	Restricciones importantes de NativeWind:
	- Usar SOLO clases base de Tailwind (no arbitrary values)
	- NO usar localStorage/sessionStorage (incompatible con React Native)
	- Preferir `className` sobre `style` inline
	- Animaciones con react-native-reanimated (no CSS animations)
* Código comentado solo cuando aporta claridad.

El objetivo es un código **legible, mantenible y defendible**.

---

## 10. Uso de Supabase

### Autenticación

* Email y contraseña.
* Manejo de sesiones automático.
* Roles gestionados a través de la base de datos.

### Base de datos

* PostgreSQL.
* Tablas normalizadas.
* Relaciones explícitas entre entidades.

### Row Level Security (RLS)

* Controla qué datos puede leer o modificar cada usuario.
* Basado en el rol y el ID del usuario autenticado.

### Edge Functions

* Utilizadas para operaciones sensibles.
* Creación de usuarios por parte del administrador.
* Validaciones críticas que no deben ejecutarse en el cliente.

### Flujo de autenticación:
```
1. Usuario ingresa credenciales
   ↓
2. Cliente llama a Supabase Auth
   ↓
3. Supabase valida credenciales
   ↓
4. Si válidas: retorna sesión + user.id
   ↓
5. AuthContext carga perfil desde tabla profiles
   ↓
6. Perfil incluye rol del usuario
   ↓
7. AuthGuard redirige según rol:
   - admin → /admin
   - padre → /parent
   - chofer → /driver
```

### Persistencia de sesión:

- Sesión guardada en AsyncStorage
- Auto-refresh de tokens
- Detección de cambios de estado (login/logout)
- Redirección automática si sesión existe

---
## 10.5 Modelo de seguridad

### Principios de seguridad implementados:

1. **Separación cliente-servidor**: Operaciones críticas solo en backend
2. **Row Level Security (RLS)**: Cada usuario solo accede a sus datos
3. **Edge Functions**: Creación de usuarios con `service_role_key` seguro
4. **Validaciones dobles**: Client-side (UX) y server-side (seguridad)
5. **No exposición de claves**: `service_role_key` nunca en el cliente
6. **Sesiones persistentes**: Almacenamiento seguro con AsyncStorage

### Flujo de seguridad en creación de usuarios:
```
Cliente → Edge Function → Validaciones → Auth.admin → Profiles → Response
         (HTTPS)          (Server-side)   (Service Role)
```

Esta arquitectura garantiza que usuarios maliciosos no puedan:
- Crear cuentas sin autorización
- Acceder a datos de otros usuarios
- Modificar roles o permisos
- Ejecutar operaciones administrativas

---

## 11. Estado actual del proyecto

Actualmente, TecniBus cuenta con:

* UI/UX completamente implementada.
* Autenticación funcional con Supabase.
* Sistema de roles (admin, padre, chofer).
* Gestión de usuarios desde el administrador.
* Arquitectura base segura y escalable.

---

## 12. Roadmap de desarrollo

Las siguientes funcionalidades están planificadas para etapas posteriores:

### FASE ACTUAL ✅
- Autenticación completa
- Gestión de usuarios (admin crea padres/choferes)
- Sistema de roles funcional (solo screens sin features)

### FASE 2 (Próxima) - Gestión de datos básicos
- [ ] Usando CRUD completar todas las funciones de admin
- [ ] CRUD de estudiantes
- [ ] Relación estudiante-padre
- [ ] CRUD de busetas
- [ ] Asignación chofer-buseta

### FASE 3 - Operaciones de transporte
- [ ] Gestión de rutas
- [ ] Asignación estudiante-ruta
- [ ] Sistema de asistencia
- [ ] Estados de recorrido

### FASE 4 - Monitoreo en tiempo real
- [ ] Tracking GPS
- [ ] Cálculo de ETA
- [ ] Visualización de mapa
- [ ] Actualización en tiempo real

### FASE 5 - Comunicación
- [ ] Notificaciones push
- [ ] Alertas de eventos
- [ ] Chat básico (opcional)

### FASE 6 - Optimización final
- [ ] Reportes y estadísticas
- [ ] Logs de auditoría
- [ ] Optimización de rendimiento
- [ ] Testing completo

Estas funcionalidades se desarrollarán de manera progresiva y controlada.

---

## 13. Uso de este documento

Este archivo **PROYECTO.md** cumple los siguientes propósitos:

* Documento de referencia técnica del sistema.
* Contexto para asistentes de código (Claude, ChatGPT).
* Base para explicación académica y defensa del proyecto.
* Guía de arquitectura y reglas del sistema.

Cualquier desarrollo futuro debe respetar lo establecido en este documento.

---

## 14. Enfoque académico

TecniBus está diseñado como un proyecto **realista, institucional y defendible**, priorizando:

* Seguridad
* Control
* Claridad arquitectónica
* Buenas prácticas

El objetivo no es solo que funcione, sino que **pueda explicarse, evaluarse y justificarse técnicamente**.

## 15. Decisiones técnicas y su justificación

### ¿Por qué React Native y no nativo?
- Desarrollo multiplataforma (iOS + Android)
- Mismo código, dos plataformas
- Comunidad activa y librerías maduras
- Ideal para MVP y proyectos académicos

### ¿Por qué Expo y no React Native CLI?
- Setup más rápido
- OTA updates sin pasar por stores
- Expo Router (file-based routing moderno)
- Mejor DX (developer experience)

### ¿Por qué Supabase y no Firebase?
- PostgreSQL (SQL real, más robusto que NoSQL para este caso)
- Edge Functions nativas (TypeScript/Deno)
- Row Level Security (seguridad a nivel de base de datos)
- Más control y transparencia
- Open source

### ¿Por qué Edge Functions y no cliente directo?
- Seguridad: `service_role_key` nunca en el cliente
- Validaciones server-side confiables
- Control total sobre lógica crítica
- Escalable y mantenible

### ¿Por qué NativeWind y no StyleSheet?
- Desarrollo más rápido (Tailwind familiar)
- Consistencia visual garantizada
- Menor código CSS custom
- Fácil mantenimiento

### ¿Por qué TypeScript y no JavaScript?
- Type safety (menos bugs)
- Mejor autocompletado (mejor DX)
- Código más mantenible
- Estándar de la industria
```

Este documento debe ser considerado como la fuente de verdad del proyecto.
Cualquier código generado debe respetar las reglas, roles y arquitectura aquí definidas.
