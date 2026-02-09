/**
 * Constantes de colores sincronizadas con tailwind.config.js
 *
 * IMPORTANTE: Si modificas colores en tailwind.config.js,
 * debes actualizar estos valores también para mantener consistencia
 * en componentes nativos como StatusBar, iconos, etc.
 */

export const Colors = {
  // Paleta principal de la marca TecniBus
  tecnibus: {
    50: '#F4FAFD',  // Fondo principal
    100: '#E8F5FB', // Tarjetas sobre el fondo
    200: '#D1EBF7', // Bordes suaves
    300: '#B9E1F2', // Inputs o campos de texto
    400: '#8CCCE9', // Color de énfasis suave
    500: '#5FB8E0', // Versión pastel del logo
    600: '#3DA7D7', // COLOR DEL LOGO (Para acciones principales)
    700: '#3592BC', // Texto de títulos
    800: '#2E7D9F', // Texto de párrafos
    900: '#1D4D62', // Texto casi oscuro
  },
  estudiante: {
    50: '#eff6ff',
    100: '#dbeafe',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
  },
  chofer: {
    50: '#fefce8',
    100: '#fef9c3',
    400: '#facc15',
    500: '#eab308',
    600: '#ca8a04',
    700: '#a16207',
  },
  admin: {
    50: '#f5fdf0',
    75: '#ebfbea',
    100: '#dcfce7',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
  },
  padre: {
    50: '#fdf1ff',
    100: '#fae1ff',
    500: '#c026d3',
    600: '#a21caf',
    700: '#86198f',
    800: '#701a75',
  },
  buseta: {
    50: '#f5ffef',
    100: '#e6ffdc',
    200: '#b8e9b8',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
  },
  ruta: {
    50: '#fdf0f0',
    100: '#fee2e2',
    200: '#fecaca',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
  },
  asign: {
    50: '#f0fdf4',
    100: '#bdbbac',
    500: '#98a7a2',
    600: '#777f7c',
    700: '#4e5452',
  },
  sky: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9',
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
  },
} as const;
