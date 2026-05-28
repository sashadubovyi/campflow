/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Bricolage Grotesque"', 'sans-serif'],
        body: ['"Outfit"', 'sans-serif'],
      },
      colors: {
        forest: {
          50: '#f3f7f3',
          100: '#e3ede2',
          500: '#4a7c59',
          600: '#3d6649',
          700: '#32533c',
          900: '#1a2e20',
        },
        ember: {
          400: '#f59e5c',
          500: '#ed8936',
        },
      },
    },
  },
  plugins: [],
};
