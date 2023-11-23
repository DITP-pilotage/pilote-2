import { memo, useEffect, useRef, useState } from 'react';
import hachuresGrisBlanc from '@/client/constants/légendes/hachure/hachuresGrisBlanc';
import CartographieSVGProps, { Viewbox } from './CartographieSVG.interface';
import CartographieZoomEtDéplacement from './ZoomEtDéplacement/CartographieZoomEtDéplacement';
import CartographieSVGStyled from './CartographieSVG.styled';
import CartographieTerritoireSélectionné from './CartographieTerritoireSélectionné';

function CartographieSVG({ options, territoires, frontières, setInfoBulle, auClicTerritoireCallback }: CartographieSVGProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [viewbox, setViewbox] = useState<Viewbox>({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });

  useEffect(() => {
    if (svgRef?.current?.getBBox) {
      setViewbox(svgRef.current.getBBox());
    }
  }, [svgRef]);


  return (
    <CartographieSVGStyled>
      {!!options.estInteractif &&
      <CartographieZoomEtDéplacement
        svgRef={svgRef}
        viewbox={viewbox}
      />}
      <div className='carte'>
        <svg
          ref={svgRef}
          version='1.2'
          viewBox={`
          ${viewbox.x}
          ${viewbox.y}
          ${viewbox.width}
          ${viewbox.height}
        `}
          xmlns='http://www.w3.org/2000/svg'
        >
          <defs>
            { hachuresGrisBlanc.patternSVG }
          </defs>
          <g
            className='canvas'
            onMouseLeave={() => {
              setInfoBulle(null);
            }}
          >
            {
              territoires.map(territoire => (
                <path
                  className={`territoire-rempli ${(options.estInteractif && territoire.estInteractif) && 'territoire-interactif'}`}
                  d={territoire.tracéSVG}
                  fill={territoire.remplissage}
                  key={`territoire-${territoire.codeInsee}`}
                  onClick={() => options.estInteractif && territoire.estInteractif && auClicTerritoireCallback(territoire.codeInsee, options.territoireSélectionnable)}
                  onMouseEnter={() => {
                    if (options.estInteractif) {
                      setInfoBulle({
                        libellé: territoire.libellé,
                        valeurAffichée: territoire.valeurAffichée,
                      });
                    } else {
                      setInfoBulle(null);
                    }
                  }}

                />),
              )
            }
            {
              frontières.map(frontière => (
                <path
                  className='territoire-frontière'
                  d={frontière.tracéSVG}
                  key={`frontière-${frontière.codeInsee}`}
                />
              ))
            }
            {options.territoireSélectionnable ? <CartographieTerritoireSélectionné multiséléction={options.multiséléction} /> : null}
          </g>
        </svg>
      </div>
    </CartographieSVGStyled>
  );
}

export default memo(CartographieSVG, (prevProps, nextProps) => (
  prevProps.territoires === nextProps.territoires &&
  prevProps.frontières === nextProps.frontières &&
  prevProps.setInfoBulle === nextProps.setInfoBulle
));
