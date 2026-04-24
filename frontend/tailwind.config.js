/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Brand = EliseAI purple (anchor 700 = #7638FA, from their CSS)
        brand: {
          50:  "#f4edff",
          100: "#e9dbff",
          200: "#d6bdff",
          300: "#bd97ff",
          400: "#a46eff",
          500: "#8f4dff",
          600: "#8347fc",
          700: "#7638fa",
          800: "#5627ba",
          900: "#472296",
          950: "#290a70",
        },
        // Accent = amber (legacy, unused by Landing)
        accent: {
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
        },
        ink: "#181819",
        mist: "#eaeaed",
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "sans-serif",
        ],
        display: [
          "'Inter Tight'",
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
        mono: [
          "'Fira Code'",
          "ui-monospace",
          "SFMono-Regular",
          "monospace",
        ],
      },
      fontWeight: {
        elise: "450",
      },
      animation: {
        "slide-in-right": "slideInRight 0.28s cubic-bezier(0.16, 1, 0.3, 1)",
        "fade-up": "fadeUp 0.4s ease-out both",
        "fade-in": "fadeIn 0.2s ease-out both",
      },
      keyframes: {
        slideInRight: {
          from: { transform: "translateX(100%)", opacity: "0" },
          to:   { transform: "translateX(0)",    opacity: "1" },
        },
        fadeUp: {
          from: { opacity: "0", transform: "translateY(6px)" },
          to:   { opacity: "1", transform: "translateY(0)"   },
        },
        fadeIn: {
          from: { opacity: "0" },
          to:   { opacity: "1" },
        },
      },
      boxShadow: {
        card:      "0 1px 3px rgba(0,0,0,0.07), 0 1px 2px rgba(0,0,0,0.04)",
        "card-lg": "0 4px 16px rgba(0,0,0,0.10), 0 2px 4px rgba(0,0,0,0.06)",
      },
    },
  },
  plugins: [],
};
