/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#FAF6F0',
          100: '#F4EBE1',
          200: '#E8D7C3',
          300: '#DABFA0',
          400: '#C79F78',
          500: '#B07D4F', // Warm terracotta-caramel
          600: '#8E5F36',
          700: '#6C4524',
          800: '#4E3018',
          900: '#2F1B0B',
        },
        rosewood: {
          50: '#FDF6F6',
          100: '#FAECEC',
          200: '#F4D4D4',
          300: '#E9AFAF',
          400: '#DA8181',
          500: '#C65A5A',
          600: '#A93F3F',
        },
        champagne: {
          50: '#FCFBF8',
          100: '#F8F4EB',
          200: '#EDE4D1',
          300: '#DECDB1',
        },
        editorial: {
          light: '#FBF9F5',
          card: '#FFFFFF',
          border: '#E8E2D8',
          text: '#221C18',
          muted: '#736B63',
          subtle: '#9E948A',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        serif: ['Playfair Display', 'Georgia', 'serif'],
      },
      boxShadow: {
        'soft': '0 2px 10px -2px rgba(45, 30, 15, 0.05), 0 1px 3px -1px rgba(45, 30, 15, 0.04)',
        'card': '0 4px 20px -2px rgba(45, 30, 15, 0.06), 0 2px 6px -1px rgba(45, 30, 15, 0.03)',
        'dropdown': '0 10px 30px -5px rgba(45, 30, 15, 0.12), 0 4px 10px -2px rgba(45, 30, 15, 0.05)',
      }
    },
  },
  plugins: [],
}
