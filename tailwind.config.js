/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './App.{js,ts,tsx}',
    './components/**/*.{js,ts,tsx,jsx}',
    './screens/**/*.{js,ts,tsx,jsx}',
    './src/**/*.{js,ts,tsx,jsx}',
  ],

  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: '#EC1D3D',
        primaryLight: '#EC1D3D',
        secondary: '#888888',
        background: '#ffffff',
        backgroundLight: '#f5f5f5',
        border: '#cccccc',
        text: '#000000',
        textWhite: '#ffffff',
        grey: '#cccccc',
      },
    },
  },
  plugins: [],
};
