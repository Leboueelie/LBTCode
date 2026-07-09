/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        lbt: {
          dark: '#0f172a',
          panel: '#1e293b',
          accent: '#38bdf8',
          success: '#34d399',
          warning: '#fbbf24',
          danger: '#ef4444',
        },
      },
    },
  },
  plugins: [],
}
