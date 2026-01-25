/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        ukraine: {
          blue: '#005BBB',
          dark: '#003D7A',
          darker: '#002855',
        },
        gold: {
          DEFAULT: '#FFD500',
          dark: '#E5BF00',
          light: '#FFE44D',
        },
        slate: {
          950: '#080C14',
          900: '#0F172A',
          800: '#1E293B',
        },
      },
      fontFamily: {
        bebas: ['"Bebas Neue"', 'cursive'],
        barlow: ['"Barlow Condensed"', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(40px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        fadeIn: 'fadeIn 1s ease-out forwards',
        slideUp: 'slideUp 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards',
      },
    },
  },
  plugins: [],
};
