/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2F6B3C',
          light: '#5FA57A',
          dark: '#1E4A28',
          50: '#E8F5E9',
          100: '#C8E6C9',
          200: '#A5D6A7',
          500: '#2F6B3C',
          600: '#266332',
          700: '#1E4A28',
          800: '#153A1E',
          900: '#0D2A14',
        },
        sand: {
          DEFAULT: '#C7A57A',
          light: '#E8D8C3',
          dark: '#A68552',
          50: '#FAF6F0',
          100: '#F7F3EE',
          200: '#E8D8C3',
          300: '#D9C4A4',
          400: '#C7A57A',
        },
        gold: {
          DEFAULT: '#F2C94C',
          light: '#F9E89B',
          dark: '#D4A520',
        },
        accent: {
          red: '#EF5350',
          blue: '#42A5F5',
          purple: '#AB47BC',
          orange: '#FF7043',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.08), 0 1px 2px -1px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 10px 25px -5px rgba(47, 107, 60, 0.15), 0 8px 10px -6px rgba(47, 107, 60, 0.1)',
        'elevated': '0 20px 40px -10px rgba(0, 0, 0, 0.12)',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.25rem',
        '3xl': '1.5rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'count': 'countUp 0.6s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateX(-10px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [],
}
