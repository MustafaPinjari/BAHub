/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "rgba(var(--border), <alpha-value>)",
        input: "rgba(var(--input), <alpha-value>)",
        ring: "rgba(var(--ring), <alpha-value>)",
        background: "rgba(var(--background), <alpha-value>)",
        foreground: "rgba(var(--foreground), <alpha-value>)",
        primary: {
          DEFAULT: "rgba(var(--primary), <alpha-value>)",
          foreground: "rgba(var(--primary-foreground), <alpha-value>)",
        },
        secondary: {
          DEFAULT: "rgba(var(--secondary), <alpha-value>)",
          foreground: "rgba(var(--secondary-foreground), <alpha-value>)",
        },
        destructive: {
          DEFAULT: "rgba(var(--destructive), <alpha-value>)",
          foreground: "rgba(var(--destructive-foreground), <alpha-value>)",
        },
        muted: {
          DEFAULT: "rgba(var(--muted), <alpha-value>)",
          foreground: "rgba(var(--muted-foreground), <alpha-value>)",
        },
        accent: {
          DEFAULT: "rgba(var(--accent), <alpha-value>)",
          foreground: "rgba(var(--accent-foreground), <alpha-value>)",
        },
        popover: {
          DEFAULT: "rgba(var(--popover), <alpha-value>)",
          foreground: "rgba(var(--popover-foreground), <alpha-value>)",
        },
        card: {
          DEFAULT: "rgba(var(--card), <alpha-value>)",
          foreground: "rgba(var(--card-foreground), <alpha-value>)",
        },
      },
      borderRadius: {
        lg: "10px",
        xl: "14px",
        "2xl": "16px",
      },
      fontFamily: {
        sans: ["Inter", "Geist", "sans-serif"],
      },
      boxShadow: {
        sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
        DEFAULT: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)",
        md: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)",
      },
    },
  },
  plugins: [],
}
