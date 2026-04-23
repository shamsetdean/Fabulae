/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,html}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#0A0908',
          900: '#141210',
          800: '#1C1A17',
          700: '#2A2622',
          600: '#3A342E'
        },
        cream: {
          50: '#FAF6F0',
          100: '#F2E9E4',
          200: '#E8DCD2',
          300: '#D4C4B5'
        },
        flame: {
          400: '#FF8F5E',
          500: '#FF6B35',
          600: '#E63946',
          700: '#C1272D'
        },
        gold: {
          400: '#F4A261',
          500: '#E9B44C'
        }
      },
      fontFamily: {
        display: ['"Instrument Serif"', 'Georgia', 'serif'],
        sans: ['"Onest"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace']
      },
      fontSize: {
        'display-xl': ['4rem', { lineHeight: '0.95', letterSpacing: '-0.03em' }],
        'display-lg': ['3rem', { lineHeight: '0.95', letterSpacing: '-0.02em' }],
        'display-md': ['2.25rem', { lineHeight: '1', letterSpacing: '-0.02em' }]
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.5s cubic-bezier(0.22, 1, 0.36, 1)',
        'pulse-slow': 'pulse 3s ease-in-out infinite'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 }
        },
        slideUp: {
          '0%': { opacity: 0, transform: 'translateY(12px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' }
        }
      }
    }
  },
  plugins: []
}
