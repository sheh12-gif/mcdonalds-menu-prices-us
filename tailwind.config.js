/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './breakfast-menu/**/*.html',
    './a-minecraft-movie-meal-10-piece-mcnuggets/**/*.html',
    './a-minecraft-movie-meal-big-mac/**/*.html',
    './hash-browns/**/*.html',
    './big-mac/**/*.html',
    './quarter-pounder-with-cheese/**/*.html',
    './double-big-mac/**/*.html',
    './double-quarter-pounder-with-cheese/**/*.html',
    './about-us/**/*.html',
    './contact-us/**/*.html',
    './privacy-policy/**/*.html',
    './disclaimer/**/*.html',
    './terms-and-conditions/**/*.html',
    './cookie-policy/**/*.html',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        mcd: {
          red: '#DA291C',
          redDark: '#B91C1C',
          redLight: '#FEF2F2',
          yellow: '#FFC72C',
          yellowDark: '#F59E0B',
          charcoal: '#1F2937',
          cream: '#FAF8F5',
        },
      },
      boxShadow: {
        card: '0 2px 10px -2px rgba(0, 0, 0, 0.05), 0 4px 16px -4px rgba(0, 0, 0, 0.03)',
        'card-hover': '0 12px 24px -6px rgba(218, 41, 28, 0.12), 0 4px 12px -2px rgba(0, 0, 0, 0.05)',
      },
    },
  },
  plugins: [],
};
