import { memo, useEffect, useRef, useState } from 'react';
import CartographieSVGProps, { Viewbox } from '@/components/_commons/Cartographie/CartographieAffichage/CartographieSVG/CartographieSVG.interface';
import CartographieZoomEtDéplacement
  from '@/components/_commons/Cartographie/CartographieZoomEtDéplacement/CartographieZoomEtDéplacement';
import CartographieSVGStyled from './CartographieSVG.styled';

function CartographieSVG({ tracésTerritoires, setTerritoireSurvolé }: CartographieSVGProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [viewbox, setViewbox] = useState<Viewbox>({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });

  useEffect(() => {
    if (svgRef && svgRef.current)
      setViewbox(svgRef.current.getBBox());
  }, [svgRef]);

  return (
    <CartographieSVGStyled>
      <CartographieZoomEtDéplacement
        svgRef={svgRef}
        viewbox={viewbox}
      />
      <svg
        ref={svgRef}
        strokeWidth="0.3"
        version="1.2"
        viewBox={`
          ${viewbox.x}
          ${viewbox.y}
          ${viewbox.width}
          ${viewbox.height}
        `}
        xmlns="http://www.w3.org/2000/svg"
      >
        <g
          className="canvas"
          onMouseLeave={() => {
            setTerritoireSurvolé(null);
          }}
        >
          {
            tracésTerritoires.map(tracéTerritoire => (
              <path
                className="territoire"
                d={tracéTerritoire.tracéSVG}
                key={tracéTerritoire.nom}
                onMouseEnter={() => {
                  setTerritoireSurvolé({ codeInsee: tracéTerritoire.codeInsee, nom: tracéTerritoire.nom });
                }}
              />
            ))
          }
        </g>
      </svg>
    </CartographieSVGStyled>
  );
}

export default memo(CartographieSVG, (prevProps, nextProps) => (
  prevProps.tracésTerritoires === nextProps.tracésTerritoires &&
  prevProps.setTerritoireSurvolé === nextProps.setTerritoireSurvolé
));
