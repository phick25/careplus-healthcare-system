import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        hospital: {
          50: '#eef8f7',
          100: '#d8efec',
          500: '#219b8b',
          600: '#167e72',
          700: '#12665e',
          900: '#183b3a',
        },
      },
    },
  },
  plugins: [],
};

export default config;
