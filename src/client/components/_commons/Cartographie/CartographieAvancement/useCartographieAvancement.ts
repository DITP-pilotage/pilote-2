import { useMemo } from 'react';
import { actionsTerritoiresStore, mailleSélectionnéeTerritoiresStore } from '@/stores/useTerritoiresStore/useTerritoiresStore';
import { CartographieDonnées } from '@/components/_commons/Cartographie/Cartographie.interface';
import { TerritoireGéographique } from '@/stores/useTerritoiresStore/useTerritoiresStore.interface';
import {
  CartographieÉlémentDeLégendeListe,
} from '@/components/_commons/Cartographie/Légende/Liste/CartographieLégendeListe.interface';
import { CartographieDonnéesAvancement } from './CartographieAvancement.interface';

const REMPLISSAGE_PAR_DÉFAUT = '#bababa';

const LÉGENDE: Record<string, CartographieÉlémentDeLégendeListe> = {
  '=0': {
    libellé: '0%',
    remplissage: 'url(#hachures-gris-blanc)',
  },
  '0-10': {
    libellé: '0-10%',
    remplissage: '#8C8CCD',
  },
  '10-20': {
    libellé: '10-20%',
    remplissage: '#7D7DC7',
  },
  '20-30': {
    libellé: '20-30%',
    remplissage: '#6E6EC0',
  },
  '30-40': {
    libellé: '30-40%',
    remplissage: '#5E5EBA',
  },
  '40-50': {
    libellé: '40-50%',
    remplissage: '#4F4FB3',
  },
  '50-60': {
    libellé: '50-60%',
    remplissage: '#3D3DAB',
  },
  '60-70': {
    libellé: '60-70%',
    remplissage: '#2E2EA5',
  },
  '70-80': {
    libellé: '70-80%',
    remplissage: '#1F1F9E',
  },
  '80-90': {
    libellé: '80-90%',
    remplissage: '#0F0F98',
  },
  '90-100': {
    libellé: '90-100%',
    remplissage: '#00006C',
  },
  '=100': {
    libellé: '100%',
    remplissage: '#2F2F2F',
  },
  'DÉFAUT': {
    libellé: 'Territoire pour lequel la donnée n’est pas disponible',
    remplissage: REMPLISSAGE_PAR_DÉFAUT,
  },
};

function déterminerValeurAffichée(valeur: number | null): string {
  if (valeur === null)
    return 'Non renseigné';

  return valeur.toFixed(0) + '%';
}

// eslint-disable-next-line sonarjs/cognitive-complexity
function déterminerRemplissage(valeur: number | null) {
  if (valeur === null)
    return REMPLISSAGE_PAR_DÉFAUT;

  const valeurArrondie = Number(valeur.toFixed(0));

  if (valeurArrondie === 0) return LÉGENDE['=0'].remplissage;
  else if (valeurArrondie > 0 && valeurArrondie < 10) return LÉGENDE['0-10'].remplissage;
  else if (valeurArrondie >= 10 && valeurArrondie < 20) return LÉGENDE['10-20'].remplissage;
  else if (valeurArrondie >= 20 && valeurArrondie < 30) return LÉGENDE['20-30'].remplissage;
  else if (valeurArrondie >= 30 && valeurArrondie < 40) return LÉGENDE['30-40'].remplissage;
  else if (valeurArrondie >= 40 && valeurArrondie < 50) return LÉGENDE['40-50'].remplissage;
  else if (valeurArrondie >= 50 && valeurArrondie < 60) return LÉGENDE['50-60'].remplissage;
  else if (valeurArrondie >= 60 && valeurArrondie < 70) return LÉGENDE['60-70'].remplissage;
  else if (valeurArrondie >= 70 && valeurArrondie < 80) return LÉGENDE['70-80'].remplissage;
  else if (valeurArrondie >= 80 && valeurArrondie < 90) return LÉGENDE['80-90'].remplissage;
  else if (valeurArrondie >= 90 && valeurArrondie < 100) return LÉGENDE['90-100'].remplissage;
  else if (valeurArrondie === 100) return LÉGENDE['=100'].remplissage;
  else return LÉGENDE.DÉFAUT.remplissage;
}

function déterminerLibellé(territoireGéographique: TerritoireGéographique | undefined, estDépartement: boolean) {
  if (!territoireGéographique)
    return '-';

  return estDépartement
    ? `${territoireGéographique.codeInsee} - ${territoireGéographique.nom}`
    : territoireGéographique.nom;
}

export default function useCartographieAvancement(données: CartographieDonnéesAvancement) {
  const mailleSélectionnée = mailleSélectionnéeTerritoiresStore();
  const { récupérerDétailsSurUnTerritoire } = actionsTerritoiresStore();

  const légende = useMemo(() => (
    Object.values(LÉGENDE).map(({ remplissage, libellé }) => ({
      libellé,
      remplissage,
    }))
  ), []);

  const donnéesCartographie = useMemo(() => {
    const donnéesFormatées: CartographieDonnées = {};

    données.forEach(({ valeur, codeInsee }) => {
      const territoireGéographique = récupérerDétailsSurUnTerritoire(codeInsee, mailleSélectionnée);
      donnéesFormatées[codeInsee] = {
        valeurAffichée: déterminerValeurAffichée(valeur),
        remplissage: déterminerRemplissage(valeur),
        libellé: déterminerLibellé(territoireGéographique, mailleSélectionnée === 'départementale'),
      };
    });

    return donnéesFormatées;
  }, [données, mailleSélectionnée, récupérerDétailsSurUnTerritoire]);

  return {
    légende,
    donnéesCartographie,
  };
}
