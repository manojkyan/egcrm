
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "var(--brand-primary)",
          dark: "var(--brand-dark)",
        }
      },
      borderRadius: { "2xl": "1rem" }
    },
  },
  plugins: [],
}
