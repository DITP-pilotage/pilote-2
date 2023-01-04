import { useEffect, useState } from 'react';
import CartographieSVG from '@/components/_commons/Cartographie2/CartographieSVG';
import CartographieProps, {
  DépartementsType,
  RégionsType,
} from '@/components/_commons/Cartographie2/Cartographie.interface';

export default function Cartographie({ territoire }: CartographieProps) {

  const [départements, setDépartements] = useState<DépartementsType>();
  const [régions, setRégions] = useState<RégionsType>();

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
      <CartographieSVG
        svgPaths={
          territoire.maille === 'région'
            ? départements.filter(département => département.région === territoire.codeInsee)
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
