import { useEffect, useState } from 'react';
import CartographieÉlément from '@/components/_commons/Cartographie/CartographieÉlément/CartographieÉlément';
import regions from '@/components/_commons/Cartographie/regions';

type DépartementsType = {
  d: string,
  département: string,
  région: string,
  nom: string,
}[];

type RégionsType = {
  d: string,
  région: string,
  nom: string,
}[];

export default function Cartographie() {

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

  return départements ? (
    <div>
      <svg
        fill="#313178"
        height="100%"
        stroke="#FFFFFF"
        strokeWidth="0.3"
        version="1.2"
        viewBox="0 0 110 100"
        width="100%"
        xmlns="http://www.w3.org/2000/svg"
      >
        {
          départements.map(département => (
            <path
              d={département.d}
              key={département.département}
            />
          ))
        }
      </svg>
    </div>
  )
    : (
      <p>
        Aucune donnée
      </p>
    );
}
