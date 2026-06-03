/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Inter Variable"', 'Inter', 'system-ui', 'sans-serif'],
        display: ['Helvetica Neue', 'Helvetica', 'Arial', 'sans-serif'],
        body: ['"Inter Variable"', 'Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Нейтральна сіро-блакитна база (фон, текст, картки)
        neutral: {
          50: '#f7f8fa',
          100: '#eef0f4',
          200: '#e2e5ec',
          300: '#cbd0db',
          400: '#9aa1b1',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2433',
          900: '#111521',
        },
        // Акцент — синій з референсів
        accent: {
          50: '#eef4ff',
          100: '#d9e6ff',
          200: '#bcd3ff',
          300: '#8eb5ff',
          400: '#598dff',
          500: '#2d6ff8',
          600: '#1a56e0',
          700: '#1543b4',
          800: '#173a8f',
          900: '#183670',
        },
        // Семантичні (бейджі, статуси)
        success: { 100: '#dcfce7', 500: '#22c55e', 700: '#15803d' },
        warning: { 100: '#fef3c7', 500: '#f59e0b', 700: '#b45309' },
        danger: { 100: '#fee2e2', 500: '#ef4444', 700: '#b91c1c' },
        // СТАРІ — лишаю на час переходу, видалю в кінці Блоку 14
        forest: {
          50: '#f3f7f3',
          100: '#e3ede2',
          500: '#4a7c59',
          600: '#3d6649',
          700: '#32533c',
          900: '#1a2e20',
        },
        ember: { 400: '#f59e5c', 500: '#ed8936' },
      },
      boxShadow: {
        card: '0 1px 3px rgba(16,21,33,0.04), 0 4px 16px rgba(16,21,33,0.05)',
        'card-lg': '0 4px 24px rgba(16,21,33,0.08), 0 8px 40px rgba(16,21,33,0.05)',
        fab: '0 8px 24px rgba(45,111,248,0.35)',
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #598dff 0%, #2d6ff8 50%, #1a56e0 100%)',
        'warm-gradient': 'linear-gradient(135deg, #fde047 0%, #f59e0b 60%, #ef4444 100%)',
        'warm-gradient-hover': 'linear-gradient(135deg, #facc15 0%, #ea580c 60%, #dc2626 100%)',
        'brand-gradient-hover': 'linear-gradient(135deg, #2d6ff8 0%, #1a56e0 50%, #1543b4 100%)',
        'rose-gradient': 'linear-gradient(135deg, #f472b6 0%, #a78bfa 100%)',
        'rose-gradient-hover': 'linear-gradient(135deg, #ec4899 0%, #7c3aed 100%)',
        'danger-gradient': 'linear-gradient(135deg, #f87171 0%, #ef4444 50%, #dc2626 100%)',
        'danger-gradient-hover': 'linear-gradient(135deg, #ef4444 0%, #dc2626 50%, #b91c1c 100%)',
      },
      borderRadius: {
        card: '20px',
        'card-lg': '24px',
      },
    },
  },
  plugins: [],
};
