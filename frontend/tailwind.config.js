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
        "card-hover": "0 2px 4px rgba(16, 24, 40, 0.08), 0 8px 16px -4px rgba(16, 24, 40, 0.10)",
        popover: "0 4px 6px -2px rgba(16, 24, 40, 0.05), 0 12px 24px -6px rgba(16, 24, 40, 0.14)",
        "sidebar-edge": "4px 0 24px rgba(14, 17, 23, 0.18)",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.96) translateY(-4px)" },
          "100%": { opacity: "1", transform: "scale(1) translateY(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.15s ease-out",
        "scale-in": "scale-in 0.12s ease-out",
      },
    },
  },
  plugins: [],
}
