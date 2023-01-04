import { useState } from 'react';
import CartographieSVGProps, { ViewboxType } from '@/components/_commons/Cartographie2/CartographieSVG.interface';

export default function CartographieSVG({ svgPaths, métadonnées }: CartographieSVGProps) {
  const [viewbox, setViewbox] = useState<ViewboxType>({
    x: 0,
    y: 0,
    width: métadonnées.largeur,
    height: métadonnées.hauteur,
  });

  return (
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
            svgPaths.map(path => (
              <path
                d={path.d}
                key={path.nom}
                onClick={(event) => {
                  setViewbox(event.currentTarget.getBBox());
                }}
              />
            ))
          }
      </svg>
    </div>
  );
}
