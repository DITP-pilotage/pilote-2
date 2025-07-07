/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/client/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/client/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // Ici on peut ajouter des customisations pour s'adapter au DSFR
      colors: {
        // Couleurs du gouvernement français
        'blue-france': 'var(--blue-france-sun-113-625)',
        'red-marianne': 'var(--red-marianne-main-472)',
      },
    },
  },
  plugins: [],
} 
