import CartographieProps from '@/components/_commons/Cartographie/Cartographie.interface';
import CartographieAffichage from '@/components/_commons/Cartographie/CartographieAffichage/CartographieAffichage';
import tracésDépartements from './départements.json';

export default function Cartographie({ zone }: CartographieProps) {
  return (
    <CartographieAffichage
      tracésTerritoires={
            zone.divisionAdministrative === 'région'
              ? tracésDépartements.filter(tracéDépartement => tracéDépartement.codeInseeRégion === zone.codeInsee)
              : tracésDépartements
        }
    />
  );
}
