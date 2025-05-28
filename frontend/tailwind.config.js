/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'hsl(var(--color-primary))',
          light: 'hsl(var(--color-primary-light))',
          dark: 'hsl(var(--color-primary-dark))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--color-secondary))',
          light: 'hsl(var(--color-secondary-light))',
          dark: 'hsl(var(--color-secondary-dark))',
        },
        accent: {
          DEFAULT: 'hsl(var(--color-accent))',
          light: 'hsl(var(--color-accent-light))',
          dark: 'hsl(var(--color-accent-dark))',
        },
        success: 'hsl(var(--color-success))',
        warning: 'hsl(var(--color-warning))',
        error: 'hsl(var(--color-error))',
        background: 'hsl(var(--color-background))',
        foreground: 'hsl(var(--color-foreground))',
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'wiggle': 'wiggle 0.5s ease-in-out',
        'pulse-shadow': 'pulse-shadow 2s infinite',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(var(--tw-gradient-stops))',
      },
      boxShadow: {
        'inner-xl': 'inset 0 0 20px 0 rgba(0, 0, 0, 0.1)',
        'glow': '0 0 15px 2px rgba(234, 179, 8, 0.4)',
      },
      transitionProperty: {
        'height': 'height',
        'spacing': 'margin, padding',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-15px) rotate(5deg)' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        },
        'pulse-shadow': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(234, 179, 8, 0.4)' },
          '50%': { boxShadow: '0 0 0 15px rgba(234, 179, 8, 0)' },
        },
      },
    },
  },
  plugins: [],
};