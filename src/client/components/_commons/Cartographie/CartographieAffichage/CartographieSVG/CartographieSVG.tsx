import { memo, useEffect, useRef, useState } from 'react';
import CartographieSVGProps, { ViewboxType } from '@/components/_commons/Cartographie/CartographieAffichage/CartographieSVG/CartographieSVG.interface';
import { DépartementsType, RégionsType } from '../../Cartographie.interface';

function CartographieSVG({ svgPaths }: CartographieSVGProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [régionSurvolée, setRégionSurvolée] = useState<Partial<DépartementsType[number]> | Partial<RégionsType>>();
  const [viewbox, setViewbox] = useState<ViewboxType>({
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
    <div>
      <svg
        fill="#313178"
        ref={svgRef}
        stroke="#FFFFFF"
        strokeWidth="0.3"
        version="1.2"
        viewBox={`
          ${viewbox.x}
          ${viewbox.y}
          ${viewbox.width}
          ${viewbox.height}
        `}
        width="100%"
        xmlns="http://www.w3.org/2000/svg"
      >
        {
          svgPaths.map(path => (
            <path
              d={path.d}
              key={path.nom}
              onMouseEnter={() => {
                console.log(régionSurvolée);
                setRégionSurvolée({ codeInsee: path.codeInsee, nom: path.nom });
              }}
            />
          ))
        }
      </svg>
    </div>
  );
}

export default memo(CartographieSVG, (prevProps, nextProps) => prevProps.svgPaths === nextProps.svgPaths);

