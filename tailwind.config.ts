import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // La paleta vive en variables CSS (app/globals.css) para poder
        // cambiar de tema claro/oscuro sin duplicar clases dark: en todo.
        ink: {
          50: "rgb(var(--ink-50) / <alpha-value>)",
          100: "rgb(var(--ink-100) / <alpha-value>)",
          200: "rgb(var(--ink-200) / <alpha-value>)",
          300: "rgb(var(--ink-300) / <alpha-value>)",
          400: "rgb(var(--ink-400) / <alpha-value>)",
          500: "rgb(var(--ink-500) / <alpha-value>)",
          600: "rgb(var(--ink-600) / <alpha-value>)",
          700: "rgb(var(--ink-700) / <alpha-value>)",
          800: "rgb(var(--ink-800) / <alpha-value>)",
          900: "rgb(var(--ink-900) / <alpha-value>)",
        },
        surface: "rgb(var(--surface) / <alpha-value>)",
        accent: {
          DEFAULT: "#0066FF",
          soft: "#3D85FF",
          glow: "rgba(0,102,255,0.18)",
        },
        flame: {
          DEFAULT: "#FF7A1A",
          soft: "#FFB066",
        },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "monospace"],
      },
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
      },
      boxShadow: {
        diffusion: "0 20px 40px -15px rgba(0,0,0,0.06), 0 8px 16px -10px rgba(0,0,0,0.04)",
        soft: "0 1px 2px rgba(0,0,0,0.04), inset 0 1px 0 var(--shadow-highlight)",
        glow: "0 0 0 8px rgba(0,102,255,0.10), 0 8px 24px -4px rgba(0,102,255,0.35)",
      },
      transitionTimingFunction: {
        "out-soft": "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
        "in-out-soft": "cubic-bezier(0.4, 0, 0.2, 1)",
        bounce: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
      },
    },
  },
  plugins: [],
};

export default config;
