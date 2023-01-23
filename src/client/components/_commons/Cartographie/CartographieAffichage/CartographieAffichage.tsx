import { useState } from 'react';
import CartographieAffichageProps, {
  CartographieBulleTerritoire,
} from './CartographieAffichage.interface';
import BulleDInfo from './BulleDInfo/BulleDInfo';
import CartographieSVG from './SVG/CartographieSVG';

function formaterBulleTitre(territoireSurvolé: CartographieBulleTerritoire) {
  return territoireSurvolé.maille === 'départementale'
    ? `${territoireSurvolé.codeInsee} – ${territoireSurvolé.nom}`
    : territoireSurvolé.nom;
}

export default function CartographieAffichage({ children, options, territoires }: CartographieAffichageProps) {
  const [sourisPosition, setSourisPosition] = useState({ x: 0, y: 0 });
  const [territoireSurvolé, setTerritoireSurvolé] = useState<CartographieBulleTerritoire | null>(null);

  return (
    <div
      className='fr-container fr-p-0'
      onPointerMove={(event) => {
        setSourisPosition({
          x: event.clientX,
          y: event.clientY,
        });
      }}
    >
      {territoireSurvolé ?
        <BulleDInfo
          contenu={options.formaterValeur(territoireSurvolé.valeur)}
          titre={formaterBulleTitre(territoireSurvolé)}
          x={sourisPosition.x}
          y={sourisPosition.y}
        />
        : null}
      <CartographieSVG
        options={options}
        setTerritoireSurvolé={setTerritoireSurvolé}
        territoires={territoires}
      />
      { children }
    </div>
  );
}
