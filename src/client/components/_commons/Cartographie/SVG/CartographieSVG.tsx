import { memo, useEffect, useRef, useState } from 'react';
import hachuresGrisBlanc from '@/client/constants/nuanciers/hachure/hachuresGrisBlanc';
import { actionsTerritoiresStore, territoireSélectionnéTerritoiresStore } from '@/client/stores/useTerritoiresStore/useTerritoiresStore';
import { CodeInsee } from '@/server/domain/territoire/Territoire.interface';
import CartographieSVGProps, { Viewbox } from './CartographieSVG.interface';
import CartographieZoomEtDéplacement from './ZoomEtDéplacement/CartographieZoomEtDéplacement';
import CartographieSVGStyled from './CartographieSVG.styled';
import CartographieTerritoireSélectionné from './CartographieTerritoireSélectionné';

function CartographieSVG({ options, territoires, frontières, setInfoBulle }: CartographieSVGProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [viewbox, setViewbox] = useState<Viewbox>({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });
  
  const { modifierTerritoireSélectionné } = actionsTerritoiresStore();
  const territoireSélectionné = territoireSélectionnéTerritoiresStore();

  useEffect(() => {
    if (svgRef && svgRef.current)
      setViewbox(svgRef.current.getBBox());
  }, [svgRef]);

  function auClicTerritoireCallback(territoireCodeInsee: CodeInsee) {
    if (!options.territoireSélectionnable) return;

    if (territoireSélectionné.codeInsee === territoireCodeInsee)
      modifierTerritoireSélectionné('FR');
    else 
      modifierTerritoireSélectionné(territoireCodeInsee);
  }

  return (
    <CartographieSVGStyled>
      <CartographieZoomEtDéplacement
        svgRef={svgRef}
        viewbox={viewbox}
      />
      <div className="carte">
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
            { hachuresGrisBlanc.patternSVG }
          </defs>
          <g
            className="canvas"
            onMouseLeave={() => {
              setInfoBulle(null);
            }}
          >
            {
              territoires.map(territoire => (
                <path
                  className='territoire-rempli'
                  d={territoire.tracéSVG}
                  fill={territoire.remplissage}
                  key={`territoire-${territoire.codeInsee}`}
                  onClick={() => auClicTerritoireCallback(territoire.codeInsee)}
                  onMouseEnter={() => {
                    setInfoBulle({
                      libellé: territoire.libellé,
                      valeurAffichée: territoire.valeurAffichée,
                    });
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
            <CartographieTerritoireSélectionné />
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
