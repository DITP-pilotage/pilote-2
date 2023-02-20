import { useState } from 'react';
import useCartographie from '@/components/_commons/Cartographie/useCartographie';
import { CartographieTerritoireSurvolé } from '@/components/_commons/Cartographie/useCartographie.interface';
import { départementsTerritoiresStore, mailleSélectionnéeTerritoiresStore } from '@/stores/useTerritoiresStore/useTerritoiresStore';
import CartographieAffichageProps from './CartographieAffichage.interface';
import BulleDInfo from './BulleDInfo/BulleDInfo';
import CartographieSVG from './SVG/CartographieSVG';

export default function CartographieAffichage({ children, options, données }: CartographieAffichageProps) {
  const niveauDeMaille = mailleSélectionnéeTerritoiresStore();
  const départements = départementsTerritoiresStore();
  const { optionsParDéfaut, déterminerRégionsÀTracer, créerTerritoires } = useCartographie();
  const [sourisPosition, setSourisPosition] = useState({ x: 0, y: 0 });
  const [territoireSurvolé, setTerritoireSurvolé] = useState<CartographieTerritoireSurvolé | null>(null);

  const optionsEffectives = { ...optionsParDéfaut, ...options };
  const régionsFiltrées =  déterminerRégionsÀTracer(optionsEffectives.territoireAffiché);

  const territoiresÀTracer = niveauDeMaille === 'départementale' ? départements : régionsFiltrées;
  const frontièreÀTracer = niveauDeMaille === 'départementale' ? régionsFiltrées : [];
  const territoires = créerTerritoires(territoiresÀTracer, frontièreÀTracer, données);

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
          contenu={territoireSurvolé.valeurAffichée}
          titre={territoireSurvolé.libellé}
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
