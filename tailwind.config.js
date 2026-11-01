/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        futa: {
          50: '#e8f5fe',
          100: '#d0eafd',
          200: '#a5d5fa',
          300: '#6dbaf6',
          400: '#1d9bf0',
          500: '#1a8cd8',
          600: '#1a73ae',
          700: '#16384f',
          800: '#102a3b',
          900: '#0b1c28',
        },
        ink: '#000000',
      },
    },
  },
  plugins: [],
}