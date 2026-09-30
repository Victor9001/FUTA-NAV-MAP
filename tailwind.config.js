/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        futa: {
          50: '#f5f2ff',
          100: '#ece5ff',
          200: '#d7c9ff',
          300: '#b89bff',
          400: '#9b6cf0',
          500: '#7c4dd9',
          600: '#5f34b0',
          700: '#4a2989',
          800: '#372066',
          900: '#241645',
        },
        ink: '#150f24',
      },
    },
  },
  plugins: [],
}