/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        tora: {
          gold: {
            DEFAULT: '#E5A93C', // Signature Golden Yellow
            50: '#FDF8EC',
            100: '#FBEFCC',
            200: '#F6DD99',
            300: '#F1CB66',
            400: '#ECB833',
            500: '#E5A93C',
            600: '#C98B22',
            700: '#9B6916',
            800: '#6C480D',
            900: '#3D2806',
          },
          dark: {
            DEFAULT: '#11100F',
            50: '#2A2725',
            100: '#23201E',
            200: '#1C1A18',
            300: '#171514',
            400: '#131110',
            500: '#0F0E0D',
            600: '#0B0A09',
            card: '#181716',
            surface: '#201E1C',
            border: '#2E2B27',
          },
          cream: {
            DEFAULT: '#F7F2EA',
            50: '#FDFBF7',
            100: '#FAF6F0',
            200: '#F3ECE0',
            300: '#EBDDCB',
            400: '#E1CDB4',
          },
          coffee: {
            DEFAULT: '#3E2723',
            dark: '#241411',
            light: '#5D4037',
            caramel: '#B07D3E',
          }
        }
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['Inter', 'Tajawal', 'Cairo', 'sans-serif'],
        arabic: ['Tajawal', 'Cairo', 'sans-serif'],
      },
      boxShadow: {
        'gold-glow': '0 0 25px -5px rgba(229, 169, 60, 0.4)',
        'gold-sm': '0 0 10px -2px rgba(229, 169, 60, 0.3)',
        'luxury': '0 20px 40px -15px rgba(0, 0, 0, 0.6)',
      }
    },
  },
  plugins: [],
};
