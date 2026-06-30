import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          50: "#f7f7f8",
          100: "#ececef",
          200: "#d9d9de",
          300: "#b6b6be",
          400: "#82828c",
          500: "#5b5b66",
          600: "#3f3f48",
          700: "#2a2a31",
          800: "#1a1a1f",
          900: "#0f0f12",
        },
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
        soft: "0 1px 2px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.6)",
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
