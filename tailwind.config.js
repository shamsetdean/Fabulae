/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,html}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#0A0908',
          900: '#15120F',
          800: '#1F1B17',
          700: '#2E2822',
          600: '#423A32'
        },
        cream: {
          50: '#FFF9F2',
          100: '#F5ECE3',   // texte principal, contraste +20% vs avant
          200: '#E8DCD0',
          300: '#B8A99A'    // texte secondaire, WCAG AA sur fond noir
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
        },
        moss: {
          400: '#A8C9A8',
          500: '#8FBF9F'    // success, cohérent avec la palette
        }
      },
      fontFamily: {
        display: ['"Instrument Serif"', 'Georgia', 'serif'],
        sans: ['"Onest"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace']
      },
      fontSize: {
        'display-xl': ['4rem', { lineHeight: '0.95', letterSpacing: '-0.03em' }],
        'display-lg': ['3rem', { lineHeight: '0.95', letterSpacing: '-0.02em' }],
        'display-md': ['2.25rem', { lineHeight: '1', letterSpacing: '-0.02em' }]
      },
      borderRadius: {
        'sm': '10px',
        'md': '14px',
        'lg': '20px',
        'xl': '28px'
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s cubic-bezier(0.22, 1, 0.36, 1)'
      }
    }
  },
  plugins: []
}
