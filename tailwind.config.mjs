/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './pages/**/*.{js,ts,jsx,tsx}',
    './lib/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        background: '#F8FAFC',
        primary: '#ef009d',
        secondary: '#FF6B6B'
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif']
      },
      borderRadius: {
        'xl': '1rem'
      },
      boxShadow: {
        soft: '0 4px 24px -6px rgba(0,0,0,0.08)'
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: 0, transform: 'translateY(12px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' }
        },
        floatSlow: {
          '0%': { transform: 'translateY(0)' },
          '100%': { transform: 'translateY(-6px)' }
        }
      },
      animation: {
        fadeInUp: 'fadeInUp 0.6s ease forwards',
        floatSlow: 'floatSlow 4s ease-in-out infinite alternate'
      }
    }
  },
  plugins: []
};
