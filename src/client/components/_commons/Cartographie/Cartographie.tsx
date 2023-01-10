import CartographieProps, { CartographieDonnées, CartographieTracéRégionJSON } from '@/components/_commons/Cartographie/Cartographie.interface';
import CartographieAffichage from '@/components/_commons/Cartographie/CartographieAffichage/CartographieAffichage';
import { CartographieTerritoire } from '@/components/_commons/Cartographie/CartographieAffichage/CartographieAffichage.interface';
import départementsJSON from './départements.json';
import régionsJSON from './régions.json';

function définirLesDépartementsÀTracer(régions: CartographieTracéRégionJSON, données: CartographieDonnées, afficherDépartements: boolean): CartographieTerritoire[] {
  return régions.map(région => (
    {
      ...région,
      sousTerritoires: afficherDépartements
        ? départementsJSON
          .filter(tracéDépartement => tracéDépartement.codeInseeRégion === région.codeInsee)
          .map(tracéDépartement => ({
            ...tracéDépartement,
            codeInseeParent: tracéDépartement.codeInseeRégion,
            sousTerritoires: [],
            valeur: données.départementale[tracéDépartement.codeInsee],
          }))
        : [],
      valeur: données.régionale[région.codeInsee],
    }),
  );
}

function sélectionnerRégion(régions: CartographieTracéRégionJSON, codeInsee: string) {
  return régions.filter(région => région.codeInsee === codeInsee);
}

export default function Cartographie({ données, niveauDeMailleAffiché, territoireAffiché }: CartographieProps) {
  const régionsSeules =
    territoireAffiché.divisionAdministrative === 'région'
      ? sélectionnerRégion(régionsJSON, territoireAffiché.codeInsee)
      : régionsJSON;

  const régionsEtDépartements = définirLesDépartementsÀTracer(régionsSeules, données, niveauDeMailleAffiché === 'départementale');

  return (
    <CartographieAffichage
      territoires={régionsEtDépartements}
    />
  );
}
