/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#FDF4F0',
          100: '#F8E4DA',
          200: '#EFC4B0',
          300: '#E09A78',
          400: '#C45C26', // copper accent CTA
          500: '#A84B1F',
          600: '#8A3D19',
          700: '#6B2F14',
          800: '#4A210E',
          900: '#2A1308',
        },
        accent: {
          400: '#C45C26',
          500: '#A84B1F',
          600: '#8A3D19',
        },
        pearl: {
          DEFAULT: '#0E1412', // page bg — near-black with the logo's teal
          dark:    '#171F1D',
        },
        ink: {
          DEFAULT: '#F2EDE6', // light text on dark
          soft:    '#C8C2B8',
        },
        surface: {
          DEFAULT: '#141C1A',
          raised:  '#1C2623',
          border:  '#2C3936',
        },
      },
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        display: ['Syne', '"DM Sans"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(0,0,0,0.4), 0 12px 32px rgba(0,0,0,0.35)',
        'card-hover': '0 8px 40px rgba(196,92,38,0.18)',
        nav: '0 8px 30px rgba(0,0,0,0.45)',
      },
      animation: {
        'fade-in': 'fadeIn 0.45s ease-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'reveal': 'reveal 0.7s ease-out both',
      },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideIn: { from: { transform: 'translateX(-100%)' }, to: { transform: 'translateX(0)' } },
        slideUp: { from: { transform: 'translateY(20px)', opacity: 0 }, to: { transform: 'translateY(0)', opacity: 1 } },
        reveal: { from: { opacity: 0, transform: 'translateY(28px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
};
