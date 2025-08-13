/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#19557F",
        primaryDark: "#092C48",
        accent: "#63BEB1",
        muted: "#C3CFDA"
      },
      borderRadius: { xl: "1rem", "2xl": "1.25rem" }
    },
  },
  plugins: [],
}
