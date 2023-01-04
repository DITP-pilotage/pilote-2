import { useEffect, useState } from 'react';
import CartographieProps, {
  Département, Région,
} from '@/components/_commons/Cartographie/Cartographie.interface';
import CartographieAffichage from '@/components/_commons/Cartographie/CartographieAffichage/CartographieAffichage';

export default function Cartographie({ territoire }: CartographieProps) {

  const [départements, setDépartements] = useState<Département[]>();
  const [régions, setRégions] = useState<Région[]>();

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
        svgPaths={
          territoire.maille === 'région'
            ? départements.filter(département => département.codeInseeRégion === territoire.codeInsee)
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
