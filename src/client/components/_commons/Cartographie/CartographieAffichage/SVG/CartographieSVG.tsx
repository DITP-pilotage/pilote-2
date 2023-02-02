import { memo, useEffect, useRef, useState } from 'react';
import {
  CartographieTerritoire,
} from '@/components/_commons/Cartographie/CartographieAffichage/CartographieAffichage.interface';
import CartographieTerritoireSélectionné
  from '@/components/_commons/Cartographie/CartographieAffichage/SVG/CartographieTerritoireSélectionné';
import {
  périmètreGéographique as périmètreGéographiqueStore,
  réinitialisePérimètreGéographique as réinitialisePérimètreGéographiqueStore,
  setPérimètreGéographique as setPérimètreGéographiqueStore,
} from '@/stores/useSélecteursPageChantiersStore/useSélecteursPageChantiersStore';
import CartographieSVGProps, { Viewbox } from './CartographieSVG.interface';
import CartographieZoomEtDéplacement from './ZoomEtDéplacement/CartographieZoomEtDéplacement';
import CartographieSVGStyled from './CartographieSVG.styled';

function CartographieSVG({ options, territoires, setTerritoireSurvolé }: CartographieSVGProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [viewbox, setViewbox] = useState<Viewbox>({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });
  const périmètreGéographique = périmètreGéographiqueStore();
  const setPérimètreGéographique = setPérimètreGéographiqueStore();
  const réinitialisePérimètreGéographique = réinitialisePérimètreGéographiqueStore();

  useEffect(() => {
    if (svgRef && svgRef.current)
      setViewbox(svgRef.current.getBBox());
  }, [svgRef]);

  function auClicTerritoireCallback(territoire: CartographieTerritoire) {
    if (!options.territoireSélectionnable) return;
    if (périmètreGéographique && périmètreGéographique.codeInsee === territoire.codeInsee) réinitialisePérimètreGéographique();
    else {
      setPérimètreGéographique({
        codeInsee: territoire.codeInsee,
        maille: territoire.maille,
      });
    }
  }

  return (
    <CartographieSVGStyled>
      <CartographieZoomEtDéplacement
        svgRef={svgRef}
        viewbox={viewbox}
      />
      <svg
        ref={svgRef}
        version="1.2"
        viewBox={`
          ${viewbox.x}
          ${viewbox.y}
          ${viewbox.width}
          ${viewbox.height}
        `}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            height="2"
            id="hachures"
            patternTransform="rotate(45)"
            patternUnits="userSpaceOnUse"
            width="2.3"
          >
            <line
              stroke="#666666"
              stroke-width="3"
              y2="3"
            />
          </pattern>
        </defs>
        <g
          className="canvas"
          onMouseLeave={() => {
            setTerritoireSurvolé(null);
          }}
        >
          {territoires.map((territoire) => (
            <g key={territoire.nom}>
              {territoire.sousTerritoires.map(sousTerritoire => (
                <path
                  className='territoire-rempli'
                  d={sousTerritoire.tracéSVG}
                  fill={options.territoireHachuré(sousTerritoire.valeur) ? 'url(#hachures)' : options.couleurDeRemplissage(sousTerritoire.valeur)}
                  key={sousTerritoire.nom}
                  onClick={() => auClicTerritoireCallback(sousTerritoire)}
                  onMouseEnter={() => {
                    setTerritoireSurvolé({
                      codeInsee: sousTerritoire.codeInsee,
                      nom: sousTerritoire.nom,
                      valeur: sousTerritoire.valeur,
                      maille: sousTerritoire.maille,
                    });
                  }}
                />
              ))}
              {territoire.sousTerritoires.length === 0 
                ?
                  <path
                    className='territoire-rempli'
                    d={territoire.tracéSVG}
                    fill={options.territoireHachuré(territoire.valeur) ? 'url(#hachures)' : options.couleurDeRemplissage(territoire.valeur)}
                    onClick={() => auClicTerritoireCallback(territoire)}
                    onMouseEnter={() => {
                      setTerritoireSurvolé({
                        codeInsee: territoire.codeInsee,
                        nom: territoire.nom,
                        valeur: territoire.valeur,
                        maille: territoire.maille,
                      });
                    }}
                  /> 
                :
                  <path
                    className='territoire-frontière'
                    d={territoire.tracéSVG}
                  />}
            </g>
          ))}
          { !!périmètreGéographique && <CartographieTerritoireSélectionné /> }
        </g>
      </svg>
    </CartographieSVGStyled>
  );
}

export default memo(CartographieSVG, (prevProps, nextProps) => (
  prevProps.territoires === nextProps.territoires &&
  prevProps.setTerritoireSurvolé === nextProps.setTerritoireSurvolé
));
