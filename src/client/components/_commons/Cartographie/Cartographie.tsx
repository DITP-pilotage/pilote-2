import CartographieProps from '@/components/_commons/Cartographie/Cartographie.interface';
import CartographieAffichage from '@/components/_commons/Cartographie/CartographieAffichage/CartographieAffichage';
import tracésDépartements from './départements.json';
import tracésRégions from './régions.json';


export default function Cartographie({ zone, maille }: CartographieProps) {

  const tracésTerritoires = (
    zone.divisionAdministrative === 'région'
      ? tracésRégions.filter(tracéRégion => tracéRégion.codeInsee === zone.codeInsee)
      : tracésRégions
  ).map(tracéRégion => (
    {
      ...tracéRégion,
      départements: maille === 'départementale'
        ? tracésDépartements.filter(tracéDépartement => tracéDépartement.codeInseeRégion === tracéRégion.codeInsee)
        : [],
    }
  ));

  return (
    <CartographieAffichage
      tracésTerritoires={tracésTerritoires}
    />
  );
}
