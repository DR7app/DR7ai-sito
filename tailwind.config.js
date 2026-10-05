/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    // Angoli vivi come la piattaforma e dr7.app: nessun raggio. Resta tondo
    // solo rounded-full, usato per i puntini decorativi.
    borderRadius: {
      none: '0', sm: '0', DEFAULT: '0', md: '0', lg: '0', xl: '0', '2xl': '0', '3xl': '0',
      full: '9999px',
    },
    extend: {
      fontFamily: {
        // Stesso font del sito dr7.app
        sans: ['Jost', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        display: ['Bodoni Moda', 'Playfair Display', 'Georgia', 'serif'],
        mono: ['IBM Plex Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        ink: '#0a0a0a',
        accent: {
          DEFAULT: '#0a84ff', // Apple-blue accent (used sparingly)
          cyan: '#06b6d4',
        },
      },
      letterSpacing: {
        tightest: '-0.04em',
      },
      maxWidth: {
        content: '1120px',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(28px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'fade-in': 'fade-in 1s ease forwards',
      },
    },
  },
  plugins: [],
}
