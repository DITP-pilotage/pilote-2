import { useState } from 'react';
import CartographieSVG from '@/components/_commons/Cartographie2/CartographieSVG';
import CartographieAffichageProps from '@/components/_commons/Cartographie2/CartographieAffichage.interface';
import BulleDInfo from '@/components/_commons/Cartographie2/BulleDInfo';

export default function CartographieAffichage({ svgPaths }: CartographieAffichageProps) {
  const [sourisPosition, setSourisPosition] = useState({ x: 0, y: 0 });

  return (
    <div
      onMouseMove={(event) => {
        setSourisPosition({
          x: event.clientX,
          y: event.clientY,
        });
      }}
    >
      <BulleDInfo
        x={sourisPosition.x}
        y={sourisPosition.y}
      />
      <CartographieSVG
        svgPaths={svgPaths}
      />
    </div>
  );
}
