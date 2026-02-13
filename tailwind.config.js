/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}", "./features/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily: {
        calsans: ["Cal-Sans"],
      },
      colors: {
        tecnibus: {
          50: "#F4FAFD", // Fondo principal (Background)
          100: "#E8F5FB", // Tarjetas sobre el fondo
          200: "#D1EBF7", // Bordes suaves
          300: "#B9E1F2", // Inputs o campos de texto
          400: "#8CCCE9", // Color de énfasis suave
          500: "#5FB8E0", // Versión pastel de tu logo
          600: "#3DA7D7", // EL COLOR DE TU LOGO (Para acciones principales)
          700: "#3592BC", // Texto de títulos
          800: "#2E7D9F", // Texto de párrafos
          900: "#1D4D62", // Texto casi oscuro
        },
      },
    },
  },
  plugins: [],
};
