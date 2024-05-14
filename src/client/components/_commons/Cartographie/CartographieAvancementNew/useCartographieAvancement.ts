import { useMemo } from 'react';
import { actionsTerritoiresStore } from '@/stores/useTerritoiresStore/useTerritoiresStore';
import { CartographieDonnées } from '@/components/_commons/Cartographie/Cartographie.interface';
import {
  CartographieÉlémentsDeLégende,
} from '@/client/components/_commons/Cartographie/Légende/CartographieLégende.interface';
import { CartographieDonnéesAvancement } from './CartographieAvancement.interface';


function déterminerValeurAffichée(valeur: number | null, estApplicable: boolean | null): string {
  if (estApplicable === false) {
    return 'Non applicable';
  }
  
  if (valeur === null)
    return 'Non renseigné';

  return valeur.toFixed(0) + '%';
}

// eslint-disable-next-line sonarjs/cognitive-complexity
function déterminerRemplissage(valeur: number | null, élémentsDeLégende: CartographieÉlémentsDeLégende, estApplicable: boolean | null) {

  if (estApplicable === false) {
    return élémentsDeLégende.NON_APPLICABLE.remplissage;
  }
  
  if (valeur === null)
    return élémentsDeLégende.DÉFAUT.remplissage;

  const valeurArrondie = Number(valeur.toFixed(0));

  if (valeurArrondie >= 0 && valeurArrondie < 10) return élémentsDeLégende['0-10'].remplissage;
  else if (valeurArrondie >= 10 && valeurArrondie < 20) return élémentsDeLégende['10-20'].remplissage;
  else if (valeurArrondie >= 20 && valeurArrondie < 30) return élémentsDeLégende['20-30'].remplissage;
  else if (valeurArrondie >= 30 && valeurArrondie < 40) return élémentsDeLégende['30-40'].remplissage;
  else if (valeurArrondie >= 40 && valeurArrondie < 50) return élémentsDeLégende['40-50'].remplissage;
  else if (valeurArrondie >= 50 && valeurArrondie < 60) return élémentsDeLégende['50-60'].remplissage;
  else if (valeurArrondie >= 60 && valeurArrondie < 70) return élémentsDeLégende['60-70'].remplissage;
  else if (valeurArrondie >= 70 && valeurArrondie < 80) return élémentsDeLégende['70-80'].remplissage;
  else if (valeurArrondie >= 80 && valeurArrondie < 90) return élémentsDeLégende['80-90'].remplissage;
  else if (valeurArrondie >= 90) return élémentsDeLégende['90-100'].remplissage;
  else return élémentsDeLégende.DÉFAUT.remplissage;
}

export default function useCartographieAvancement(données: CartographieDonnéesAvancement, élémentsDeLégende: CartographieÉlémentsDeLégende, mailleSelectionnee: 'départementale' | 'régionale') {
  const { récupérerDétailsSurUnTerritoireAvecCodeInsee } = actionsTerritoiresStore();

  const légende = useMemo(() => {
    
    const tousApplicables: Boolean = données.map(d => d.estApplicable).every(el => el !== false);
    const tousNonNull: Boolean = données.map(d => d.valeur !== null).every(el => el === true);

    let légendeAffichée = Object.values(élémentsDeLégende);
    if (tousApplicables) {
      légendeAffichée = légendeAffichée
        .filter(el => el.libellé !== 'Territoire où le chantier prioritaire ne s’applique pas');
    }

    if (tousNonNull) {
      légendeAffichée = légendeAffichée
        .filter(el => el.libellé !== 'Territoire pour lequel la donnée n’est pas renseignée/disponible');
    }
    
    légendeAffichée = légendeAffichée.map(({ remplissage, libellé }) => ({
      libellé,
      remplissage,
    }));

    return légendeAffichée;

  }, [élémentsDeLégende, données]);

  const donnéesCartographie = useMemo(() => {
    const donnéesFormatées: CartographieDonnées = {};

    données.forEach(({ valeur, codeInsee, estApplicable }) => {
      const territoireGéographique = récupérerDétailsSurUnTerritoireAvecCodeInsee(codeInsee, mailleSelectionnee);

      donnéesFormatées[codeInsee] = {
        valeurAffichée: déterminerValeurAffichée(valeur, estApplicable),
        remplissage: déterminerRemplissage(valeur, élémentsDeLégende, estApplicable),
        libellé: territoireGéographique.nomAffiché,
      };
    });

    return donnéesFormatées;
  }, [données, mailleSelectionnee, récupérerDétailsSurUnTerritoireAvecCodeInsee, élémentsDeLégende]);

  return {
    légende,
    donnéesCartographie,
  };
}
