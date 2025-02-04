import { useMemo } from 'react';
import { actionsTerritoiresStore } from '@/stores/useTerritoiresStore/useTerritoiresStore';
import { CartographieÉlémentsDeLégende } from '@/client/components/_commons/Cartographie/Légende/CartographieLégende.interface';
import { CartographieDonnées } from '@/client/components/_commons/Cartographie/Cartographie.interface';
import { objectEntries } from '@/client/utils/objects/objects';
import { DétailsIndicateurTerritoire } from '@/server/domain/indicateur/DétailsIndicateur.interface';

type TypeProposition = 'PROPOSITION' | 'PROPOSITION_AVEC_PONDERATION';
type DonneesCartographieProposition = {
  valeur: TypeProposition | null
  territoireCode: string
  estApplicable: boolean | null
};


function determinerRemplissage(valeur: TypeProposition | null, elementsDeLegende: CartographieÉlémentsDeLégende, estApplicable: boolean | null) {
  if (!estApplicable) {
    return elementsDeLegende.NON_APPLICABLE.remplissage;
  }
  return !valeur ? elementsDeLegende.DEFAUT.remplissage : elementsDeLegende[valeur].remplissage;
}

export default function useCartographiePropositionValeurIndicateur(detailsIndicateurTerritoire: DétailsIndicateurTerritoire, elementsDeLegende: CartographieÉlémentsDeLégende) {
  const donnees: DonneesCartographieProposition[] = objectEntries(detailsIndicateurTerritoire).map(([territoireCodeDonnee, detailsIndicateur]) => ({
    valeur: detailsIndicateur.proposition !== null ? (detailsIndicateur.pondération !== null && detailsIndicateur.pondération > 0 ? 'PROPOSITION_AVEC_PONDERATION' : 'PROPOSITION') : null,
    territoireCode: territoireCodeDonnee as string,
    estApplicable: detailsIndicateur.est_applicable,
  }));

  const { récupérerDétailsSurUnTerritoire } = actionsTerritoiresStore();

  const legende = useMemo(() => {
    const tousApplicables: Boolean = donnees.every(d => d.estApplicable);

    let legendeAffichee = Object.values(elementsDeLegende);
    if (tousApplicables) {
      legendeAffichee = legendeAffichee
        .filter(el => el.libellé !== 'Territoire où le chantier prioritaire ne s’applique pas');
    }

    return legendeAffichee.map(({ remplissage, libellé }) => ({
      libellé,
      remplissage,
    }));

  }, [elementsDeLegende, donnees]);

  const donneesCartographie = donnees.reduce((acc, val) => {
    const territoireGeographique = récupérerDétailsSurUnTerritoire(val.territoireCode);

    return {
      ...acc,
      [val.territoireCode]: {
        contenu: undefined,
        remplissage: determinerRemplissage(val.valeur, elementsDeLegende, val.estApplicable),
        libellé: territoireGeographique.nomAffiché,
        estApplicable: val.estApplicable,
      },
    };
  }, {} as CartographieDonnées);

  return {
    legende,
    donneesCartographie,
    legendeDegrade: null,
  };
}
