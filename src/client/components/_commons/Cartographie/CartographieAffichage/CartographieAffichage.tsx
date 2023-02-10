import { useState } from 'react';
import CartographieAffichageProps, { CartographieBulleTerritoire } from './CartographieAffichage.interface';
import BulleDInfo from './BulleDInfo/BulleDInfo';
import CartographieSVG from './SVG/CartographieSVG';
import useCartographie from '../useCartographie';

export default function CartographieAffichage({ children, options, données, niveauDeMaille }: CartographieAffichageProps) {
  const { optionsParDéfaut, déterminerRégionsÀTracer, créerTerritoires, formaterBulleTitre } = useCartographie();
  const [sourisPosition, setSourisPosition] = useState({ x: 0, y: 0 });
  const [territoireSurvolé, setTerritoireSurvolé] = useState<CartographieBulleTerritoire | null>(null);

  const optionsEffectives = { ...optionsParDéfaut, ...options };
  const régionsFiltrées =  déterminerRégionsÀTracer(optionsEffectives.territoireAffiché);
  const territoires = créerTerritoires(régionsFiltrées, données, niveauDeMaille === 'départementale');

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
          contenu={optionsEffectives.formaterValeur(territoireSurvolé.valeur)}
          titre={formaterBulleTitre(territoireSurvolé)}
          x={sourisPosition.x}
          y={sourisPosition.y}
        />
        : null}
      <CartographieSVG
        options={optionsEffectives}
        setTerritoireSurvolé={setTerritoireSurvolé}
        territoires={territoires}
      />
      { children }
    </div>
  );
}
