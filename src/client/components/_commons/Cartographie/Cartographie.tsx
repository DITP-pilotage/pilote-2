import { useEffect, useState } from 'react';
import CartographieProps, { TracéDépartement, TracéRégion } from '@/components/_commons/Cartographie/Cartographie.interface';
import CartographieAffichage from '@/components/_commons/Cartographie/CartographieAffichage/CartographieAffichage';

export default function Cartographie({ zone }: CartographieProps) {

  const [départements, setDépartements] = useState<TracéDépartement[]>();
  const [régions, setRégions] = useState<TracéRégion[]>();

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/comma-dangle
    const télécharger = <T,>(url: string, callback: (données: T) => void) => {
      fetch(url).then((response) => {
        if (response.status > 400)
          throw new Error('Erreur au téléchargement de ' + url);
        return response.json();
      }).then((données: T) => {
        callback(données);
      });
    };

    télécharger('/geo/départements.json', setDépartements);
    télécharger('/geo/régions.json', setRégions);
  }, []);

  return (
    départements && régions) ? (
      <CartographieAffichage
        tracésTerritoires={
          zone.divisionAdministrative === 'région'
            ? départements.filter(département => département.codeInseeRégion === zone.codeInsee)
            : départements
        }
      />
    )
    : (
      <p>
        Aucune donnée
      </p>
    );
}
