import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#284074",
          50: "#eef1f8",
          100: "#d5ddef",
          200: "#abbbd e",
          300: "#8099cd",
          400: "#5677bc",
          500: "#284074",
          600: "#22366200",
          700: "#1c2c50",
          800: "#16223e",
          900: "#10182c",
          950: "#0a0f1a",
        },
        brand: {
          navy: "#284074",
          light: "#3d5a9e",
          pale: "#eef1f8",
          accent: "#f0a500",
        }
      },
      fontFamily: {
        display: ["'Clash Display'", "sans-serif"],
        body: ["'Plus Jakarta Sans'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "mesh-pattern": "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23284074' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-in-out",
        "slide-up": "slideUp 0.5s ease-out",
        "slide-in-right": "slideInRight 0.3s ease-out",
        "pulse-slow": "pulse 3s infinite",
        "float": "float 6s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        slideInRight: {
          "0%": { transform: "translateX(20px)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-20px)" },
        },
      },
      boxShadow: {
        "glow": "0 0 20px rgba(40, 64, 116, 0.3)",
        "glow-lg": "0 0 40px rgba(40, 64, 116, 0.4)",
        "card": "0 4px 24px rgba(0, 0, 0, 0.06)",
        "card-hover": "0 8px 40px rgba(0, 0, 0, 0.12)",
      },
    },
  },
  plugins: [],
};

export default config;
