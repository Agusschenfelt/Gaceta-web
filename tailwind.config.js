/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}",],
  theme: {
    extend: {colors: {
        primario: 'var(--color-primario)',
        secundario: 'var(--color-secundario)',
        fondo: 'var(--color-fondo)',
      },
      fontFamily: {
        inter: ['"Inter"', 'sans-serif'],
        instrument: ['"Instrument Serif"', 'sans-serif'],
        roboto: ['"Roboto Mono"', 'monospace'],
      }},
  },
  plugins: [],
}

