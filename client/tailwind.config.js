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
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        emergency: {
          50: '#fef2f2',
          100: '#fee2e2',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
        },
        ktas: {
          1: '#dc2626', // Resuscitation (Red)
          2: '#ea580c', // Emergent (Orange)
          3: '#eab308', // Urgent (Yellow)
          4: '#16a34a', // Less Urgent (Green)
          5: '#2563eb', // Non-Urgent (Blue)
        }
      },
      fontFamily: {
        sans: ['Inter', 'Plus Jakarta Sans', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glow-red': '0 0 20px -3px rgba(220, 38, 38, 0.4)',
        'glow-blue': '0 0 20px -3px rgba(37, 99, 235, 0.35)',
        'glow-emerald': '0 0 20px -3px rgba(16, 185, 129, 0.35)',
      }
    },
  },
  plugins: [],
}
