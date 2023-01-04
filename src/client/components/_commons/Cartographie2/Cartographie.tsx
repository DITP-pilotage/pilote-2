import { useEffect, useState } from 'react';

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

type MétadonnéesType = {
  largeur: number,
  hauteur: number,
};

type ViewboxType = {
  x: number,
  y: number,
  width: number,
  height: number,
};

export default function Cartographie() {

  const [départements, setDépartements] = useState<DépartementsType>();
  const [régions, setRégions] = useState<RégionsType>();
  const [métadonnées, setMétadonnées] = useState<MétadonnéesType>();
  const [viewbox, setViewbox] = useState<ViewboxType>();

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

  useEffect(() => {
    if (!métadonnées)
      return;
    setViewbox({
      x: 0,
      y: 0,
      width: métadonnées.largeur,
      height: métadonnées.hauteur,
    });
  }, [métadonnées]);


  return (départements && régions && métadonnées && viewbox) ? (
    <div>
      <svg
        fill="#313178"
        stroke="#FFFFFF"
        strokeWidth="0.3"
        version="1.2"
        viewBox={`
          ${viewbox.x}
          ${viewbox.y}
          ${Math.max(viewbox.width, viewbox.height) /* Préserve le ratio hauteur/largeur */}
          ${Math.max(viewbox.width, viewbox.height)}
        `}
        width="100%"
        xmlns="http://www.w3.org/2000/svg"
      >
        {
          départements.map(département => (
            <path
              d={département.d}
              key={département.département}
              onClick={(event) => {
                setViewbox(event.currentTarget.getBBox());
              }}
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
