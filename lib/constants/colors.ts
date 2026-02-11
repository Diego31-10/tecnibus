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
} as const;
