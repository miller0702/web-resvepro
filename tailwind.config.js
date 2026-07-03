/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Instrument Serif"', 'Georgia', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      colors: {
        ink: {
          DEFAULT: '#0c0f14',
          soft: '#151a22',
          muted: '#1e2530',
        },
        parchment: {
          DEFAULT: '#f7f3ec',
          dark: '#ebe4d6',
        },
        gold: {
          DEFAULT: '#c9a227',
          light: '#e8c547',
          dim: '#8a6f1a',
        },
        sage: {
          DEFAULT: '#4a6741',
          light: '#6b8f61',
        },
        ember: '#b85c38',
      },
      boxShadow: {
        card: '0 4px 24px -4px rgba(12, 15, 20, 0.08)',
        'card-dark': '0 4px 24px -4px rgba(0, 0, 0, 0.35)',
        glow: '0 0 40px -10px rgba(201, 162, 39, 0.35)',
      },
      backgroundImage: {
        grain:
          "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E\")",
      },
    },
  },
  plugins: [],
};
