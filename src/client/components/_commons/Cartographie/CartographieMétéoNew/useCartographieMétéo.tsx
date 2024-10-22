import { useMemo } from 'react';
import { actionsTerritoiresStore } from '@/stores/useTerritoiresStore/useTerritoiresStore';
import { CartographieDonnées } from '@/components/_commons/Cartographie/Cartographie.interface';
import { libellésMétéos, Météo } from '@/server/domain/météo/Météo.interface';
import {
  CartographieÉlémentsDeLégende,
} from '@/client/components/_commons/Cartographie/Légende/CartographieLégende.interface';
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

export default function useCartographieMétéo(données: CartographieDonnéesMétéo, élémentsDeLégende: CartographieÉlémentsDeLégende, mailleSelectionnee: 'départementale' | 'régionale') {
  const { récupérerDétailsSurUnTerritoireAvecCodeInsee } = actionsTerritoiresStore();

  const légende = useMemo(() => {
    const tousApplicables: Boolean = données.every(d => d.estApplicable);
    const tousNonNull: Boolean = données.every(d => d.valeur !== 'NON_RENSEIGNEE');

    let légendeAffichée = Object.values(élémentsDeLégende);
    if (tousApplicables) {
      légendeAffichée = légendeAffichée
        .filter(el => el.libellé !== 'Territoire où le chantier prioritaire ne s’applique pas');
    }

    if (tousNonNull) {
      légendeAffichée = légendeAffichée
        .filter(el => el.libellé !== 'Territoire pour lequel la météo n’est pas renseignée');
    }

    légendeAffichée = légendeAffichée.map(({ remplissage, libellé }) => ({
      libellé,
      remplissage,
    }));

    return légendeAffichée;

  }, [élémentsDeLégende, données]);

  const donnéesCartographie = données.reduce((acc, val) => {
    const territoireGéographique = récupérerDétailsSurUnTerritoireAvecCodeInsee(val.codeInsee, mailleSelectionnee);

    return {
      ...acc,
      [val.codeInsee]: {
        contenu: (
          <div className='fr-text--bold'>
            { val.estApplicable === false ? 'Non applicable' : libellésMétéos[val.valeur] }
          </div>
        ),
        remplissage: déterminerRemplissage(val.valeur, élémentsDeLégende, val.estApplicable),
        libellé: territoireGéographique.nomAffiché,
      },
    };
  }, {} as CartographieDonnées);

  return {
    légende,
    donnéesCartographie,
  };
}
