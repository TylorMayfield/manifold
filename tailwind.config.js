/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Cell-shaded black/white design system
        primary: {
          DEFAULT: "#000000", // Pure black
          50: "#f8f9fa",      // Light surface
          100: "#e9ecef",     // Lighter gray
          200: "#dee2e6",     // Light gray borders
          300: "#ced4da",     // Medium light gray
          400: "#adb5bd",     // Medium gray
          500: "#6c757d",     // Dark gray text
          600: "#495057",     // Darker gray
          700: "#343a40",     // Very dark gray
          800: "#212529",     // Near black
          900: "#000000",     // Pure black
        },
        accent: {
          DEFAULT: "#0066ff",  // Blue accent
          50: "#e6f2ff",
          100: "#cce5ff",
          200: "#99ccff",
          300: "#66b3ff",
          400: "#3399ff",
          500: "#0066ff",
          600: "#0052cc",
          700: "#003d99",
          800: "#002966",
          900: "#001433",
        },
        success: "#22c55e",
        warning: "#f59e0b",
        error: "#ef4444",
        // Keep white definitions for backward compatibility
        white: "#ffffff",
        black: "#000000",
        gray: {
          50: "#f8f9fa",
          100: "#e9ecef",
          200: "#dee2e6",
          300: "#ced4da",
          400: "#adb5bd",
          500: "#6c757d",
          600: "#495057",
          700: "#343a40",
          800: "#212529",
          900: "#000000",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Consolas", "Monaco", "monospace"],
        display: ["Inter", "system-ui", "sans-serif"],
      },
      animation: {
        // Cell-shaded animations - sharp and snappy
        "pop-in": "popIn 0.15s ease-out",
        "slide-up": "slideUp 0.2s ease-out",
        "slide-down": "slideDown 0.2s ease-out",
        "fade-in": "fadeIn 0.1s ease-out",
        "bounce-in": "bounceIn 0.3s ease-out",
        "shake": "shake 0.5s ease-in-out",
      },
      keyframes: {
        popIn: {
          "0%": { transform: "scale(0.8)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        slideDown: {
          "0%": { transform: "translateY(-10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        bounceIn: {
          "0%": { transform: "scale(0.3)", opacity: "0" },
          "50%": { transform: "scale(1.1)" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        shake: {
          "0%, 100%": { transform: "translateX(0)" },
          "10%, 30%, 50%, 70%, 90%": { transform: "translateX(-2px)" },
          "20%, 40%, 60%, 80%": { transform: "translateX(2px)" },
        },
      },
      // Cell-shaded specific utilities
      boxShadow: {
        'cell': '2px 2px 0px 0px rgba(0, 0, 0, 1)',
        'cell-sm': '1px 1px 0px 0px rgba(0, 0, 0, 1)',
        'cell-lg': '4px 4px 0px 0px rgba(0, 0, 0, 1)',
        'cell-inset': 'inset 2px 2px 0px 0px rgba(0, 0, 0, 0.1)',
      },
      borderWidth: {
        '3': '3px',
        '4': '4px',
      },
    },
  },
  plugins: [],
};
