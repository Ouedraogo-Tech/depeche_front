/** @type {import('tailwindcss').Config} */
module.exports = {
  // Fichiers où Tailwind cherche les classes utilisées (sinon aucune classe ne fonctionne)
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      // Couleurs relevées dans les maquettes
      colors: {
        creme: '#F6F1E7', // fond des pages
        ligne: '#ECE6D8', // bordures des cartes, séparateurs
        sable: '#DED4BE', // emplacements d'images
        marine: {
          DEFAULT: '#1B2A4A', // sidebar, boutons, titres
          fonce: '#0F1B33', // footer
        },
        brique: '#C30909', // rouge du logo : flash info, menu actif, boutons rouges
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Fraunces', 'Georgia', 'serif'], // titres "journal"
      },
    },
  },
  plugins: [],
};
