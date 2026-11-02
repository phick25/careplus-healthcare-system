import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        medical: {
          50: '#effcfb',
          100: '#d3f6f2',
          500: '#10a99a',
          600: '#07877e',
          700: '#086d67',
          900: '#104a48',
        },
      },
      boxShadow: {
        card: '0 18px 55px -30px rgba(15, 71, 79, 0.25)',
      },
    },
  },
  plugins: [],
};

export default config;
