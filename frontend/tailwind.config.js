/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#0E1117",
          900: "#141824",
          800: "#1B2030",
          700: "#242B3D",
          600: "#333B52",
        },
        amber: {
          500: "#F5A623",
          600: "#E0941A",
        },
        status: {
          available: "#22C55E",
          ontrip: "#3B82F6",
          inshop: "#F59E0B",
          retired: "#EF4444",
          suspended: "#EF4444",
          draft: "#94A3B8",
          offduty: "#64748B",
          completed: "#22C55E",
          dispatched: "#3B82F6",
          cancelled: "#EF4444",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(16, 24, 40, 0.06), 0 1px 3px rgba(16, 24, 40, 0.08)",
      },
    },
  },
  plugins: [],
}
