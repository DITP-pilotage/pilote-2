import { useRef } from 'react';
import CartographieProps from './Cartographie.interface';
import CartographieÉlément from './CartographieÉlément/CartographieÉlément';
import regions from './regions';
import styles from './Cartographie.module.scss';
import CartographieZoomEtDéplacement from './CartographieZoomEtDéplacement/CartographieZoomEtDéplacement';

const CORRESPONDANCE_COULEUR_SEUIL = [
  {
    seuil: 10,
    couleur: '#d5d5d5',
  },
  {
    seuil: 20,
    couleur: '#ececfe',
  },
  {
    seuil: 30,
    couleur: '#e3e3fd',
  },
  {
    seuil: 40,
    couleur: '#cacafb',
  },
  {
    seuil: 50,
    couleur: '#cacafb',
  },
  {
    seuil: 60,
    couleur: '#8585f6',
  },
  {
    seuil: 70,
    couleur: '#6a6af4',
  },
  {
    seuil: 80,
    couleur: '#000091',
  },
  {
    seuil: 90,
    couleur: '#313178',
  },
  {
    seuil: 100,
    couleur: '#3a3a68',
  },
];

const couleurDeFond = (valeur: number) => {
  return CORRESPONDANCE_COULEUR_SEUIL.find(seuil => valeur <= seuil.seuil)?.couleur || '#000000';
};

export default function Cartographie({ données, afficherFrance = false }: CartographieProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const svgGRef = useRef(null);
  const conteneurRef = useRef<HTMLDivElement>(null);

  return (
    <>
      <CartographieZoomEtDéplacement
        conteneurRef={conteneurRef}
        svgGRef={svgGRef}
        svgRef={svgRef}
      />
      <div
        className={`${styles.svgConteneur} fr-p-1w`}
        ref={conteneurRef}
      >
        <svg
          height="100%"
          ref={svgRef}
          version="1.2"
          width="100%"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g ref={svgGRef}>
            {
                données.map(donnée => (
                  <CartographieÉlément
                    afficherDansLaFrance={afficherFrance}
                    couleurDeFond={couleurDeFond(donnée.valeur)}
                    donnéesGeo={regions[donnée.codeInsee]}
                    key={donnée.codeInsee}
                  />
                ))
              }
          </g>
        </svg>
      </div>
    </>
  );
}
