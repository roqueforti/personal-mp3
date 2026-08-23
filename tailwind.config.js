/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-jakarta)', 'Plus Jakarta Sans', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      colors: {
        background: "#f8fafc",
        surface: "#ffffff",
        "surface-raised": "#f1f5f9",
        "surface-active": "#e2e8f0",
        border: "#e2e8f0",
        "border-light": "#f1f5f9",
        primary: {
          50: "#f4f4f5",
          100: "#e4e4e7",
          200: "#d4d4d8",
          300: "#a1a1aa",
          400: "#71717a",
          500: "#18181b", // Solid Dark Charcoal Primary
          600: "#09090b",
          700: "#040405",
          800: "#000000",
          900: "#000000",
          DEFAULT: "#18181b",
        },
        accent: {
          emerald: "#10b981",
          rose: "#ef4444",
          amber: "#f59e0b",
          indigo: "#4f46e5",
        }
      },
      animation: {
        'spin-slow': 'spin 12s linear infinite',
      }
    },
  },
  plugins: [],
};
