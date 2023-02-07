import { remplissageParDéfaut, NuancierPourcentage } from './nuancier';

const nuancierPourcentage: NuancierPourcentage = [
  {
    seuil: 0,
    libellé: '0%',
    remplissage: {
      type: 'HACHURES',
      valeur: 'hachures-gris-blanc',
    },
  },
  {
    seuil: 10,
    libellé: '0-10%',
    remplissage: {
      type: 'COULEUR',
      valeur: '#8C8CCD',
    },
  }, {
    seuil: 20,
    libellé: '10-20%',
    remplissage: {
      type: 'COULEUR',
      valeur: '#7D7DC7',
    },
  }, {
    seuil: 30,
    libellé: '20-30%',
    remplissage: {
      type: 'COULEUR',
      valeur: '#6E6EC0',
    },
  }, {
    seuil: 40,
    libellé: '30-40%',
    remplissage: {
      type: 'COULEUR',
      valeur: '#5E5EBA',
    },
  }, {
    seuil: 50,
    libellé: '40-50%',
    remplissage: {
      type: 'COULEUR',
      valeur: '#4F4FB3',
    },
  }, {
    seuil: 60,
    libellé: '50-60%',
    remplissage: {
      type: 'COULEUR',
      valeur: '#3D3DAB',
    },
  }, {
    seuil: 70,
    libellé: '60-70%',
    remplissage: {
      type: 'COULEUR',
      valeur: '#2E2EA5',
    },
  }, {
    seuil: 80,
    libellé: '70-80%',
    remplissage: {
      type: 'COULEUR',
      valeur: '#1F1F9E',
    },
  }, {
    seuil: 90,
    libellé: '80-90%',
    remplissage: {
      type: 'COULEUR',
      valeur: '#0F0F98',
    },
  }, {
    seuil: 99.99,
    libellé: '90-100%',
    remplissage : {
      type: 'COULEUR',
      valeur: '#00006C',
    },
  },
  {
    seuil: 100,
    libellé: '100%',
    remplissage : {
      type: 'COULEUR',
      valeur: '#2F2F2F',
    },
  },
  {
    seuil: null,
    libellé: 'Territoire pour lequel la donnée n’est pas disponible',
    remplissage: remplissageParDéfaut,
  },
];

export default nuancierPourcentage;
