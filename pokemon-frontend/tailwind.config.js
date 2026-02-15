/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        gbc: {
          shell: "#2D1B69",        // Purple body
          "shell-light": "#3D2B7E",
          "shell-dark": "#1E0F4F",
          screen: "#8BAC0F",       // Green screen base
          "screen-dark": "#306230",
          "screen-light": "#9BBC0F",
          text: "#0F380F",
          "text-mid": "#306230",
          accent: "#E63946",       // Red LED
          dpad: "#1a1a2e",
        },
      },
      fontFamily: {
        gb: ['"Press Start 2P"', 'monospace'], // Fuente pixelada
      },
      backgroundImage: {
        'gbc-body': 'linear-gradient(160deg, #3D2B7E 0%, #2D1B69 40%, #1E0F4F 100%)',
        'space-gradient': 'linear-gradient(135deg, #0a0a1a 0%, #1a1030 40%, #0d0d20 100%)',
      },
      boxShadow: {
        'gbc-shell': '0 20px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1), inset 0 -2px 0 rgba(0,0,0,0.3)',
        'gbc-screen': 'inset 0 2px 8px rgba(0,0,0,0.5), inset 0 0 20px rgba(0,0,0,0.2)',
        'dpad': 'inset 0 1px 2px rgba(0,0,0,0.4), 0 1px 0 rgba(255,255,255,0.05)',
        'btn': '0 3px 0 #a82935, inset 0 1px 0 rgba(255,255,255,0.2)',
      }
    },
  },
  plugins: [],
}