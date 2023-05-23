import { useMemo } from 'react';
import { actionsTerritoiresStore } from '@/stores/useTerritoiresStore/useTerritoiresStore';
import { CartographieDonnées } from '@/components/_commons/Cartographie/Cartographie.interface';
import { CartographieÉlémentsDeLégende } from '@/client/components/_commons/Cartographie/Légende/CartographieLégende.interface';
import { CartographieDonnéesAvancement } from './CartographieAvancement.interface';


function déterminerValeurAffichée(valeur: number | null): string {
  if (valeur === null)
    return 'Non renseigné';

  return valeur.toFixed(0) + '%';
}

// eslint-disable-next-line sonarjs/cognitive-complexity
function déterminerRemplissage(valeur: number | null, élémentsDeLégende: CartographieÉlémentsDeLégende) {
  if (valeur === null)
    return élémentsDeLégende.DÉFAUT.remplissage;

  const valeurArrondie = Number(valeur.toFixed(0));

  if (valeurArrondie === 0) return élémentsDeLégende['=0'].remplissage;
  else if (valeurArrondie > 0 && valeurArrondie < 10) return élémentsDeLégende['0-10'].remplissage;
  else if (valeurArrondie >= 10 && valeurArrondie < 20) return élémentsDeLégende['10-20'].remplissage;
  else if (valeurArrondie >= 20 && valeurArrondie < 30) return élémentsDeLégende['20-30'].remplissage;
  else if (valeurArrondie >= 30 && valeurArrondie < 40) return élémentsDeLégende['30-40'].remplissage;
  else if (valeurArrondie >= 40 && valeurArrondie < 50) return élémentsDeLégende['40-50'].remplissage;
  else if (valeurArrondie >= 50 && valeurArrondie < 60) return élémentsDeLégende['50-60'].remplissage;
  else if (valeurArrondie >= 60 && valeurArrondie < 70) return élémentsDeLégende['60-70'].remplissage;
  else if (valeurArrondie >= 70 && valeurArrondie < 80) return élémentsDeLégende['70-80'].remplissage;
  else if (valeurArrondie >= 80 && valeurArrondie < 90) return élémentsDeLégende['80-90'].remplissage;
  else if (valeurArrondie >= 90 && valeurArrondie <= 100) return élémentsDeLégende['90-100'].remplissage;
  else return élémentsDeLégende.DÉFAUT.remplissage;
}

export default function useCartographieAvancement(données: CartographieDonnéesAvancement, élémentsDeLégende: CartographieÉlémentsDeLégende) {
  const { récupérerDétailsSurUnTerritoireAvecCodeInsee } = actionsTerritoiresStore();

  const légende = useMemo(() => (
    Object.values(élémentsDeLégende).map(({ remplissage, libellé }) => ({
      libellé,
      remplissage,
    }))
  ), [élémentsDeLégende]);

  const donnéesCartographie = useMemo(() => {
    const donnéesFormatées: CartographieDonnées = {};

    données.forEach(({ valeur, codeInsee }) => {
      const territoireGéographique = récupérerDétailsSurUnTerritoireAvecCodeInsee(codeInsee);

      donnéesFormatées[codeInsee] = {
        valeurAffichée: déterminerValeurAffichée(valeur),
        remplissage: déterminerRemplissage(valeur, élémentsDeLégende),
        libellé: territoireGéographique.nomAffiché,
      };
    });

    return donnéesFormatées;
  }, [données, récupérerDétailsSurUnTerritoireAvecCodeInsee, élémentsDeLégende]);

  return {
    légende,
    donnéesCartographie,
  };
}
