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
        success: { 100: '#dcfce7', 500: '#22c55e', 700: '#15803d' },
        warning: { 100: '#fef3c7', 500: '#f59e0b', 700: '#b45309' },
        danger: { 100: '#fee2e2', 500: '#ef4444', 700: '#b91c1c' },
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
        // Legacy
        card: '0 1px 3px rgba(16,21,33,0.04), 0 4px 16px rgba(16,21,33,0.05)',
        'card-lg': '0 4px 24px rgba(16,21,33,0.08), 0 8px 40px rgba(16,21,33,0.05)',
        fab: '0 8px 24px rgba(45,111,248,0.25)',
        // Liquid Glass shadows
        glass: '0 0 0 0.5px rgba(0,0,0,0.04), 0 2px 8px rgba(0,0,0,0.04), 0 8px 28px rgba(0,0,0,0.07), inset 0 1px 0 rgba(255,255,255,0.85)',
        'glass-hover': '0 0 0 0.5px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06), 0 16px 48px rgba(0,0,0,0.10), inset 0 1px 0 rgba(255,255,255,0.92)',
        'glass-panel': '0 0 0 0.5px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06), 0 20px 60px rgba(0,0,0,0.11), inset 0 1px 0 rgba(255,255,255,0.95)',
        'glass-blue': 'inset 0 1px 0 rgba(255,255,255,0.28), 0 4px 16px rgba(45,111,248,0.22)',
        'glass-blue-hover': 'inset 0 1px 0 rgba(255,255,255,0.22), 0 6px 24px rgba(45,111,248,0.32)',
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
        'gemini-active': 'linear-gradient(135deg, rgba(72,140,251,0.12) 0%, rgba(41,219,188,0.08) 50%, rgba(101,90,220,0.10) 100%)',
        'gemini-active-hover': 'linear-gradient(135deg, rgba(72,140,251,0.18) 0%, rgba(41,219,188,0.12) 50%, rgba(101,90,220,0.15) 100%)',
        // Ambient glass background
        'glass-ambient': 'radial-gradient(ellipse 900px 700px at 10% 15%, rgba(99,102,241,0.11) 0%, transparent 60%), radial-gradient(ellipse 700px 600px at 88% 10%, rgba(45,111,248,0.09) 0%, transparent 55%), radial-gradient(ellipse 600px 800px at 60% 90%, rgba(139,92,246,0.08) 0%, transparent 55%), radial-gradient(ellipse 800px 500px at 5% 75%, rgba(20,184,166,0.06) 0%, transparent 50%)',
      },
      borderRadius: {
        card: '24px',
        'card-lg': '28px',
      },
      keyframes: {
        'brand-pulse': {
          '0%, 100%': { opacity: '0.25', transform: 'scale(0.98)' },
          '50%': { opacity: '1', transform: 'scale(1.02)' },
        },
        'glass-shimmer': {
          '0%': { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
      },
      animation: {
        'brand-pulse': 'brand-pulse 1.8s ease-in-out infinite',
        'glass-shimmer': 'glass-shimmer 2.4s linear infinite',
      },
    },
  },
  plugins: [],
};
