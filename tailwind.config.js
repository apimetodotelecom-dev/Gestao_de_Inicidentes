/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'custom-bg': '#1a202c',
        'custom-card': '#2d3748',
        'custom-text': '#e2e8f0',
        'custom-accent': '#4299e1',
      },
    },
  },
  plugins: [],
}
