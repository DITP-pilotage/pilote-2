import { memo, useEffect, useRef, useState } from 'react';
import CartographieSVGProps, { Viewbox } from '@/components/_commons/Cartographie/CartographieAffichage/CartographieSVG/CartographieSVG.interface';
import CartographieZoomEtDéplacement
  from '@/components/_commons/Cartographie/CartographieZoomEtDéplacement/CartographieZoomEtDéplacement';
import CartographieSVGStyled from './CartographieSVG.styled';

function CartographieSVG({ svgPaths, setTerritoireSurvolé }: CartographieSVGProps) {
  const conteneurRef = useRef<HTMLDivElement | null>(null);
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
    <CartographieSVGStyled ref={conteneurRef}>
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
        <g className="canvas">
          {
            svgPaths.map(path => (
              <path
                d={path.d}
                key={path.nom}
                onMouseEnter={(event) => {
                  setTerritoireSurvolé({ codeInsee: path.codeInsee, nom: path.nom });
                  event.currentTarget.setAttribute('opacity', '0.72');
                }}
                onMouseLeave={(event) => {
                  setTerritoireSurvolé(null);
                  event.currentTarget.setAttribute('opacity', '1');
                }}
              />
            ))
          }
        </g>
      </svg>
    </CartographieSVGStyled>
  );
}

export default memo(CartographieSVG, (prevProps, nextProps) => prevProps.svgPaths === nextProps.svgPaths);
