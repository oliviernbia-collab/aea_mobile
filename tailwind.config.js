/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx}', './components/**/*.{js,jsx}'],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#1e3a8a', dark: '#172a63' },
        accent: '#f59e0b',
        bgLight: '#f8fafc',
        bgDark: '#0f172a',
      },
    },
  },
  plugins: [],
};
