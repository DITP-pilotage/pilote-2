import { useMemo } from 'react';
import { actionsTerritoiresStore } from '@/stores/useTerritoiresStore/useTerritoiresStore';
import { CartographieDonnées } from '@/components/_commons/Cartographie/Cartographie.interface';
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
    remplissage: '#e6e6f4',
  },
  '10-20': {
    libellé: '10-20%',
    remplissage: '#d7d7ee',
  },
  '20-30': {
    libellé: '20-30%',
    remplissage: '#cbcbe8',
  },
  '30-40': {
    libellé: '30-40%',
    remplissage: '#bbbbe2',
  },
  '40-50': {
    libellé: '40-50%',
    remplissage: '#aeaedc',
  },
  '50-60': {
    libellé: '50-60%',
    remplissage: '#9a9ad4',
  },
  '60-70': {
    libellé: '60-70%',
    remplissage: '#8686cb',
  },
  '70-80': {
    libellé: '70-80%',
    remplissage: '#6666bd',
  },
  '80-90': {
    libellé: '80-90%',
    remplissage: '#4040ad',
  },
  '90-100': {
    libellé: '90-100%',
    remplissage: '#000091',
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

export default function useCartographieAvancement(données: CartographieDonnéesAvancement) {
  const { récupérerDétailsSurUnTerritoireAvecCodeInsee } = actionsTerritoiresStore();

  const légende = useMemo(() => (
    Object.values(LÉGENDE).map(({ remplissage, libellé }) => ({
      libellé,
      remplissage,
    }))
  ), []);

  const donnéesCartographie = useMemo(() => {
    const donnéesFormatées: CartographieDonnées = {};

    données.forEach(({ valeur, codeInsee }) => {
      const territoireGéographique = récupérerDétailsSurUnTerritoireAvecCodeInsee(codeInsee);

      donnéesFormatées[codeInsee] = {
        valeurAffichée: déterminerValeurAffichée(valeur),
        remplissage: déterminerRemplissage(valeur),
        libellé: territoireGéographique.nomAffiché,
      };
    });

    return donnéesFormatées;
  }, [données, récupérerDétailsSurUnTerritoireAvecCodeInsee]);

  return {
    légende,
    donnéesCartographie,
  };
}
