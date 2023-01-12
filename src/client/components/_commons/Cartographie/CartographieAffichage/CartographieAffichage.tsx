import { useState } from 'react';
import CartographieSVG from '@/components/_commons/Cartographie/CartographieAffichage/CartographieSVG/CartographieSVG';
import CartographieAffichageProps, {
  CartographieBulleTerritoire,
} from '@/components/_commons/Cartographie/CartographieAffichage/CartographieAffichage.interface';
import BulleDInfo from '@/components/_commons/Cartographie/CartographieAffichage/BulleDInfo/BulleDInfo';
import { nuancierPourcentage } from '@/components/_commons/Cartographie/nuancier/nuancier';
import CartographieLégende
  from '@/components/_commons/Cartographie/CartographieAffichage/CartographieLégende/CartographieLégende';

export default function CartographieAffichage({ territoires }: CartographieAffichageProps) {
  const [sourisPosition, setSourisPosition] = useState({ x: 0, y: 0 });
  const [territoireSurvolé, setTerritoireSurvolé] = useState<CartographieBulleTerritoire | null>(null);

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
          contenu={territoireSurvolé.valeur ? territoireSurvolé.valeur.affichée : 'Non renseigné'}
          titre={`${territoireSurvolé.codeInsee} - ${territoireSurvolé.nom}`}
          x={sourisPosition.x}
          y={sourisPosition.y}
        />
        : null}
      <CartographieSVG
        nuancier={nuancierPourcentage}
        setTerritoireSurvolé={setTerritoireSurvolé}
        territoires={territoires}
      />
      <CartographieLégende nuancier={nuancierPourcentage} />
    </div>
  );
}
