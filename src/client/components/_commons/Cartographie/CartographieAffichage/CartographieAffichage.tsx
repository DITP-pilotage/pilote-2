import { useState } from 'react';
import CartographieSVG from '@/components/_commons/Cartographie/CartographieAffichage/CartographieSVG/CartographieSVG';
import CartographieAffichageProps, {
  Territoire,
} from '@/components/_commons/Cartographie/CartographieAffichage/CartographieAffichage.interface';
import BulleDInfo from '@/components/_commons/Cartographie/CartographieAffichage/BulleDInfo/BulleDInfo';

export default function CartographieAffichage({ tracésRégions, fonctionDAffichage }: CartographieAffichageProps) {
  const [sourisPosition, setSourisPosition] = useState({ x: 0, y: 0 });
  const [territoireSurvolé, setTerritoireSurvolé] = useState<Territoire | null>(null);

  return (
    <div
      onPointerMove={(event) => {
        setSourisPosition({
          x: event.clientX,
          y: event.clientY,
        });
      }}
    >
      {territoireSurvolé ?
        <BulleDInfo
          contenu={fonctionDAffichage(territoireSurvolé.valeur)}
          titre={`${territoireSurvolé.codeInsee} - ${territoireSurvolé.nom}`}
          x={sourisPosition.x}
          y={sourisPosition.y}
        />
        : null}
      <CartographieSVG
        setTerritoireSurvolé={setTerritoireSurvolé}
        tracésRégions={tracésRégions}
      />
    </div>
  );
}
