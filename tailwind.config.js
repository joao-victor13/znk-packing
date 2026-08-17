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
        brand: {
          50: 'rgb(var(--color-primary-light-rgb, 250, 246, 240) / <alpha-value>)',
          100: 'rgb(var(--color-primary-subtle-rgb, 244, 235, 225) / <alpha-value>)',
          200: 'rgb(var(--color-primary-border-rgb, 232, 215, 195) / <alpha-value>)',
          300: 'rgb(var(--color-primary-border-rgb, 218, 191, 160) / <alpha-value>)',
          400: 'rgb(var(--color-primary-rgb, 199, 159, 120) / <alpha-value>)',
          500: 'rgb(var(--color-primary-rgb, 176, 125, 79) / <alpha-value>)',
          600: 'rgb(var(--color-primary-hover-rgb, 142, 95, 54) / <alpha-value>)',
          700: 'rgb(var(--color-primary-hover-rgb, 108, 69, 36) / <alpha-value>)',
          800: 'rgb(var(--color-primary-text-rgb, 78, 48, 24) / <alpha-value>)',
          900: 'rgb(var(--color-primary-text-rgb, 47, 27, 11) / <alpha-value>)',
        },
        editorial: {
          light: 'var(--color-bg-light, #FAF8F5)',
          card: 'var(--color-card-bg, #FFFFFF)',
          border: 'var(--color-border, #E8D7C3)',
          text: 'var(--color-text, #221C18)',
          muted: 'var(--color-text-muted, #736B63)',
          subtle: 'var(--color-border, #9E948A)',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['Playfair Display', 'Georgia', 'serif'],
      },
      boxShadow: {
        'soft': '0 2px 10px -2px rgba(0, 0, 0, 0.05), 0 1px 3px -1px rgba(0, 0, 0, 0.03)',
        'card': '0 4px 20px -2px rgba(0, 0, 0, 0.06), 0 2px 6px -1px rgba(0, 0, 0, 0.03)',
        'dropdown': '0 10px 30px -5px rgba(0, 0, 0, 0.15), 0 4px 10px -2px rgba(0, 0, 0, 0.05)',
      }
    },
  },
  plugins: [],
}
