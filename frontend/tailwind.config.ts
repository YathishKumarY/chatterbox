/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        cb: {
          green: '#25D366',
          dark: '#075E54',
          light: 'rgb(var(--cb-light) / <alpha-value>)',
          teal: '#128C7E',
          bg: 'rgb(var(--cb-bg) / <alpha-value>)',
          chatbg: 'rgb(var(--cb-chatbg) / <alpha-value>)',
          panel: 'rgb(var(--cb-panel) / <alpha-value>)',
          surface: 'rgb(var(--cb-surface) / <alpha-value>)',
          'surface-hover': 'rgb(var(--cb-surface-hover) / <alpha-value>)',
          'surface-active': 'rgb(var(--cb-surface-active) / <alpha-value>)',
          'input-bg': 'rgb(var(--cb-input-bg) / <alpha-value>)',
          border: 'rgb(var(--cb-border) / <alpha-value>)',
          'border-light': 'rgb(var(--cb-border-light) / <alpha-value>)',
          'text-primary': 'rgb(var(--cb-text-primary) / <alpha-value>)',
          'text-secondary': 'rgb(var(--cb-text-secondary) / <alpha-value>)',
          'text-muted': 'rgb(var(--cb-text-muted) / <alpha-value>)',
          'avatar-bg': 'rgb(var(--cb-avatar-bg) / <alpha-value>)',
        },
      },
    },
  },
  plugins: [],
};
