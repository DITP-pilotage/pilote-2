import { useEffect, useState } from 'react';
import CartographieSVG from '@/components/_commons/Cartographie2/CartographieSVG';
import {
  DépartementsType,
  MétadonnéesType,
  RégionsType,
} from '@/components/_commons/Cartographie2/Cartographie.interface';



export default function Cartographie() {

  const [départements, setDépartements] = useState<DépartementsType>();
  const [régions, setRégions] = useState<RégionsType>();
  const [métadonnées, setMétadonnées] = useState<MétadonnéesType>();

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
    télécharger('/geo/métadonnées.json', setMétadonnées);
  }, []);


  return (
    départements && régions && métadonnées) ? (
      <CartographieSVG
        métadonnées={métadonnées}
        svgPaths={départements}
      />
    )
    : (
      <p>
        Aucune donnée
      </p>
    );
}
