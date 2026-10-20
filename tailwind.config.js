const defaultTheme = require('tailwindcss/defaultTheme');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', ...defaultTheme.fontFamily.sans],
        display: ['var(--font-display)', 'Cormorant Garamond', ...defaultTheme.fontFamily.serif],
        serif: ['var(--font-display)', 'Cormorant Garamond', ...defaultTheme.fontFamily.serif],
      },
      colors: {
        brand: {
          50: '#fffbf0',
          100: '#fef4d6',
          500: '#d97706',
          600: '#b45309',
          900: '#451a03',
        },
        'versace-green': {
          DEFAULT: '#133B27',
          50: '#eef3f0',
          100: '#d5e2da',
          500: '#2c7a52',
          700: '#1B4F35',
          900: '#0c2417',
        },
        // Admin panel: green-tinted neutrals and brass, so the panel shares the shop's palette
        panel: {
          50: '#f4f7f4',
          100: '#e7ede8',
          200: '#d2ddd5',
          300: '#b2c3b7',
          400: '#8ca394',
          500: '#6b8475',
          600: '#51695b',
          700: '#385143',
          800: '#1d3a2a',
          900: '#11291c',
          950: '#0a1c12',
        },
        brass: {
          50: '#faf6ec',
          100: '#f2e8cf',
          200: '#e7d4a6',
          300: '#dcbf80',
          400: '#d1ae69',
          500: '#c5a059',
          600: '#94733a',
          700: '#7a5e2f',
          800: '#5f4925',
          900: '#45351b',
        },
        'versace-gold': {
          DEFAULT: '#C5A059',
          50: '#f9f6f0',
          100: '#f0e8d9',
          500: '#C5A059',
          700: '#96763a',
          900: '#5c4720',
        }
      },
      backdropBlur: {
        xs: '2px',
      },
      keyframes: {
        placard: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'showcase-progress': {
          '0%': { transform: 'scaleX(0)' },
          '100%': { transform: 'scaleX(1)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '1', filter: 'brightness(1)' },
          '50%': { opacity: '0.8', filter: 'brightness(1.2)', boxShadow: '0 0 15px rgba(245, 158, 11, 0.4)' },
        },
        'float-gentle': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        'glow-pulse': {
          '0%, 100%': { opacity: '0.3', transform: 'scale(1)' },
          '50%': { opacity: '0.6', transform: 'scale(1.05)' },
        },
        'slide-up-spring': {
          '0%': { transform: 'translateY(60px)', opacity: '0' },
          '60%': { transform: 'translateY(-5px)', opacity: '1' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'stagger-in': {
          '0%': { transform: 'translateY(30px) scale(0.95)', opacity: '0' },
          '100%': { transform: 'translateY(0) scale(1)', opacity: '1' },
        },
        'breathe': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.02)' },
        },
        'gradient-flow': {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        'ripple': {
          '0%': { transform: 'scale(0.8)', opacity: '0.6' },
          '100%': { transform: 'scale(2.4)', opacity: '0' },
        },
        'orbit': {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' },
        },
        'orbit-reverse': {
          from: { transform: 'rotate(360deg)' },
          to: { transform: 'rotate(0deg)' },
        },
        'sparkle': {
          '0%, 100%': { opacity: '0', transform: 'scale(0) rotate(0deg)' },
          '50%': { opacity: '1', transform: 'scale(1) rotate(180deg)' },
        },
      },
      animation: {
        placard: 'placard 0.7s cubic-bezier(.2,.7,.2,1) both',
        'showcase-progress': 'showcase-progress linear forwards',
        fadeIn: 'fadeIn 0.5s ease-out forwards',
        slideUp: 'slideUp 0.6s ease-out forwards',
        slideInRight: 'slideInRight 0.6s ease-out forwards',
        shimmer: 'shimmer 2s infinite linear',
        'pulse-glow': 'pulse-glow 2s infinite ease-in-out',
        'float-gentle': 'float-gentle 4s ease-in-out infinite',
        'glow-pulse': 'glow-pulse 3s ease-in-out infinite',
        'slide-up-spring': 'slide-up-spring 0.8s ease-out forwards',
        'stagger-in': 'stagger-in 0.6s ease-out forwards',
        'breathe': 'breathe 4s ease-in-out infinite',
        'gradient-flow': 'gradient-flow 6s ease infinite',
        'ripple': 'ripple 2s ease-out infinite',
        'orbit': 'orbit 20s linear infinite',
        'orbit-reverse': 'orbit-reverse 25s linear infinite',
        'sparkle': 'sparkle 3s ease-in-out infinite',
      }
    },
  },
  plugins: [],
};
