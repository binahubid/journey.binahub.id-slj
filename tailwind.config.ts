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
        navy: {
          DEFAULT: "#0F1E3D",
          50: "#F0F4FA",
          100: "#DCE5F5",
          800: "#13254A",
          900: "#0F1E3D",
        },
        accent: {
          DEFAULT: "#C79A3C",
          hover: "#B2872E",
          light: "#F5ECCB",
        },
        warm: {
          bg: "#FAF8F4",
          surface: "#FFFFFF",
          border: "#E5E7EB",
        },
        status: {
          success: "#2F855A",
          warning: "#C05621",
          danger: "#B91C1C",
          info: "#2563EB",
        },
      },
      maxWidth: {
        wizard: "680px",
        landing: "1200px",
        dashboard: "1440px",
      },
      borderRadius: {
        sm: "6px",
        md: "12px",
        lg: "20px",
        xl: "16px",
        "2xl": "24px",
        "3xl": "32px",
      },
      fontFamily: {
        sans: ["var(--font-jakarta-sans)", "Plus Jakarta Sans", "Inter", "system-ui", "sans-serif"],
        secondary: ["var(--font-inter)", "Inter", "sans-serif"],
        serif: ["Georgia", "Cambria", "Times New Roman", "serif"],
      },
      boxShadow: {
        sm: "0 1px 2px rgba(15, 30, 61, 0.06)",
        md: "0 4px 12px rgba(15, 30, 61, 0.08)",
        lg: "0 12px 32px rgba(15, 30, 61, 0.10)",
      },
      animation: {
        "spring-pop": "springPop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
      },
      keyframes: {
        springPop: {
          "0%": { transform: "scale(0.95)" },
          "50%": { transform: "scale(1.05)" },
          "100%": { transform: "scale(1)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
