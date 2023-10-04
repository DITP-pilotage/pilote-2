import { useMemo } from 'react';
import { actionsTerritoiresStore } from '@/stores/useTerritoiresStore/useTerritoiresStore';
import { CartographieDonnées } from '@/components/_commons/Cartographie/Cartographie.interface';
import { libellésMétéos, Météo } from '@/server/domain/météo/Météo.interface';
import { CartographieÉlémentsDeLégende } from '@/client/components/_commons/Cartographie/Légende/CartographieLégende.interface';
import { CartographieDonnéesMétéo } from './CartographieMétéo.interface';


function déterminerRemplissage(valeur: Météo | null, élémentsDeLégende: CartographieÉlémentsDeLégende, estApplicable: boolean | null) {
  
  // eslint-disable-next-line unicorn/prefer-switch
  if (estApplicable === false) return élémentsDeLégende.NON_APPLICABLE.remplissage;
  else if (valeur === 'ORAGE') return élémentsDeLégende.ORAGE.remplissage;
  else if (valeur === 'COUVERT') return élémentsDeLégende.COUVERT.remplissage;
  else if (valeur === 'NUAGE') return élémentsDeLégende.NUAGE.remplissage;
  else if (valeur === 'SOLEIL') return élémentsDeLégende.SOLEIL.remplissage;
  else return élémentsDeLégende.DÉFAUT.remplissage;
}

export default function useCartographieMétéo(données: CartographieDonnéesMétéo, élémentsDeLégende: CartographieÉlémentsDeLégende) {
  const { récupérerDétailsSurUnTerritoireAvecCodeInsee } = actionsTerritoiresStore();

  const légende = useMemo(() => (
    Object.values(élémentsDeLégende).map(({ remplissage, libellé, picto }) => ({
      libellé,
      remplissage,
      picto,
    }))
  ), [élémentsDeLégende]);

  const donnéesCartographie = useMemo(() => {
    let donnéesFormatées: CartographieDonnées = {};

    données.forEach(({ valeur, codeInsee, estApplicable }) => {
      const territoireGéographique = récupérerDétailsSurUnTerritoireAvecCodeInsee(codeInsee);
  
      donnéesFormatées[codeInsee] = {
        valeurAffichée: estApplicable === false ? 'Non applicable' : libellésMétéos[valeur],
        remplissage: déterminerRemplissage(valeur, élémentsDeLégende, estApplicable),
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
