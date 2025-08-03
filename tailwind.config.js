/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        forest: {
          50: '#f7fdf7',
          100: '#e8f5e8',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          900: '#14532d',
        }
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'rotate-slow': 'rotate 20s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        }
      },
      fontFamily: {
        oswald: ['Oswald', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
