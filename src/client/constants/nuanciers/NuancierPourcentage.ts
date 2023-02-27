import Nuancier, { remplissageParDéfaut, NuancierRemplissage } from './Nuancier';

type NuancePourcentage = {
  seuil: number | null,
  libellé: string,
  remplissage: NuancierRemplissage,
};

class NuancierPourcentage implements Nuancier {
  readonly nuances: NuancePourcentage[] = [
    {
      seuil: 0,
      libellé: '0%',
      remplissage: 'url(#hachures-gris-blanc)',
    },
    {
      seuil: 10,
      libellé: '0-10%',
      remplissage: '#8C8CCD',
    }, {
      seuil: 20,
      libellé: '10-20%',
      remplissage: '#7D7DC7',
    }, {
      seuil: 30,
      libellé: '20-30%',
      remplissage: '#6E6EC0',
    }, {
      seuil: 40,
      libellé: '30-40%',
      remplissage: '#5E5EBA',
    }, {
      seuil: 50,
      libellé: '40-50%',
      remplissage: '#4F4FB3',
    }, {
      seuil: 60,
      libellé: '50-60%',
      remplissage: '#3D3DAB',
    }, {
      seuil: 70,
      libellé: '60-70%',
      remplissage: '#2E2EA5',
    }, {
      seuil: 80,
      libellé: '70-80%',
      remplissage: '#1F1F9E',
    }, {
      seuil: 90,
      libellé: '80-90%',
      remplissage: '#0F0F98',
    }, {
      seuil: 99.99,
      libellé: '90-100%',
      remplissage: '#00006C',
    },
    {
      seuil: 100,
      libellé: '100%',
      remplissage: '#2F2F2F',
    },
    {
      seuil: null,
      libellé: 'Territoire pour lequel la donnée n’est pas disponible',
      remplissage: remplissageParDéfaut,
    },
  ];

  déterminerRemplissage(valeur: number | null): NuancierRemplissage {
    if (valeur === null)
      return remplissageParDéfaut;
    return this.nuances
      .find(
        ({ seuil }) => seuil !== null && seuil >= Math.round(valeur),
      )?.remplissage
      ?? remplissageParDéfaut;
  }

}

export default NuancierPourcentage;
