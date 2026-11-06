/** @type {import('tailwindcss').Config} */
// Tailwind usa la clase `dark` y escanea las plantillas del frontend para generar CSS.
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
