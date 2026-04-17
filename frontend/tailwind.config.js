/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-pastel-blue': '#E0F2FE',
        'brand-pastel-purple': '#F3E8FF',
        'brand-pastel-rose': '#FFE4E6',
      }
    },
  },
  plugins: [],
}
