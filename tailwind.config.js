/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        accent: "#E8392A",
        "accent-light": "#FFF0EE",
      },
    },
  },
  plugins: [],
}
