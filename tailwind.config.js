/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-primary': '#4A90E2',
        'brand-secondary': '#F5A623',
        'brand-light': '#E8F1FC',
        'brand-dark': '#0D2F53',
        'brand-accent': '#50E3C2',
      },
    },
  },
  plugins: [],
}
