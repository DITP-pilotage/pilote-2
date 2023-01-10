import CartographieProps, { TracéRégionJSON } from '@/components/_commons/Cartographie/Cartographie.interface';
import CartographieAffichage from '@/components/_commons/Cartographie/CartographieAffichage/CartographieAffichage';
import { TracéRégion } from '@/components/_commons/Cartographie/CartographieAffichage/CartographieAffichage.interface';
import départementsJSON from './départements.json';
import régionsJSON from './régions.json';

function définirLesDépartementsÀTracer(régions: TracéRégionJSON, afficherDépartements: boolean): TracéRégion[] {
  return régions.map(région => (
    {
      ...région,
      départementsÀTracer: afficherDépartements
        ? départementsJSON.filter(tracéDépartement => tracéDépartement.codeInseeRégion === région.codeInsee)
        : [],
    }),
  );
}

function sélectionnerRégion(régions: TracéRégionJSON, codeInsee: string) {
  return régions.filter(région => région.codeInsee === codeInsee);
}

export default function Cartographie({ territoireAffiché, niveauDeMailleAffiché }: CartographieProps) {
  const tracésRégionsSansDépartement =
    territoireAffiché.divisionAdministrative === 'région'
      ? sélectionnerRégion(régionsJSON, territoireAffiché.codeInsee)
      : régionsJSON;

  const tracésRégions = définirLesDépartementsÀTracer(tracésRégionsSansDépartement, niveauDeMailleAffiché === 'départementale');

  return (
    <CartographieAffichage
      tracésRégions={tracésRégions}
    />
  );
}
