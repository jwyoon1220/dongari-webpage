/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.ts', './functions/**/*.ts'],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"Apple SD Gothic Neo"',
          '"Segoe UI"',
          '"Malgun Gothic"',
          'Roboto',
          'sans-serif',
        ],
      },
      boxShadow: {
        glow: '0 0 0 1px rgb(99 102 241 / 0.15), 0 8px 24px -8px rgb(99 102 241 / 0.25)',
      },
    },
  },
  plugins: [],
};
