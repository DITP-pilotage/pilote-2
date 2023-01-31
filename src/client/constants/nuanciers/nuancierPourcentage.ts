import { couleurParDéfaut, NuancierPourcentage } from './nuancier';

const nuancierPourcentage: NuancierPourcentage = [
  {
    seuil: 1,
    libellé: '0%',
    couleur: '#ffff',
    hachures: '#666666',
  },
  {
    seuil: 10,
    libellé: '0-10%',
    couleur: '#8C8CCD',
  }, {
    seuil: 20,
    libellé: '10-20%',
    couleur: '#7D7DC7',
  }, {
    seuil: 30,
    libellé: '20-30%',
    couleur: '#6E6EC0',
  }, {
    seuil: 40,
    libellé: '30-40%',
    couleur: '#5E5EBA',
  }, {
    seuil: 50,
    libellé: '40-50%',
    couleur: '#4F4FB3',
  }, {
    seuil: 60,
    libellé: '50-60%',
    couleur: '#3D3DAB',
  }, {
    seuil: 70,
    libellé: '60-70%',
    couleur: '#2E2EA5',
  }, {
    seuil: 80,
    libellé: '70-80%',
    couleur: '#1F1F9E',
  }, {
    seuil: 90,
    libellé: '80-90%',
    couleur: '#0F0F98',
  }, {
    seuil: 99,
    libellé: '90-100%',
    couleur : '#00006C',
  },
  {
    seuil: 100,
    libellé: '100%',
    couleur : '#2F2F2F',
  },
  {
    seuil: null,
    libellé: 'Territoire pour lequel la donnée n’est pas disponible',
    couleur: couleurParDéfaut,
  },
];

export default nuancierPourcentage;
