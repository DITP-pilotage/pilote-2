import { useState } from 'react';
import useCartographie from '@/components/_commons/Cartographie/useCartographieNew';
import { CartographieInfoBulle } from '@/components/_commons/Cartographie/useCartographie.interface';
import { départementsTerritoiresStore } from '@/stores/useTerritoiresStore/useTerritoiresStore';
import CartographieProps from './CartographieNew.interface';
import BulleDInfo from './BulleDInfo/BulleDInfo';
import CartographieSVG from './SVG/CartographieSVG';

export default function Cartographie({ options, données, children, auClicTerritoireCallback, territoireCode, mailleSelectionnee }: CartographieProps) {
  const départements = départementsTerritoiresStore();

  const { optionsParDéfaut, déterminerRégionsÀTracer, créerTerritoires } = useCartographie(territoireCode);

  const [sourisPosition, setSourisPosition] = useState({ x: 0, y: 0 });
  const [infoBulle, setInfoBulle] = useState<CartographieInfoBulle | null>(null);

  const optionsEffectives = { ...optionsParDéfaut, ...options };

  const régionsFiltrées =  déterminerRégionsÀTracer(optionsEffectives.territoireAffiché);
  const territoiresÀTracer = mailleSelectionnee === 'départementale' ? départements : régionsFiltrées;
  const frontièreÀTracer = mailleSelectionnee === 'départementale' ? régionsFiltrées : [];
  const territoiresEtFrontières = créerTerritoires(territoiresÀTracer, frontièreÀTracer, données);
  
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
      {
        infoBulle ?
          <BulleDInfo
            contenu={infoBulle.valeurAffichée}
            titre={infoBulle.libellé}
            x={sourisPosition.x}
            y={sourisPosition.y}
          />
          : null
      }
      <CartographieSVG
        auClicTerritoireCallback={auClicTerritoireCallback}
        frontières={territoiresEtFrontières.frontières}
        options={optionsEffectives}
        setInfoBulle={setInfoBulle}
        territoires={territoiresEtFrontières.territoires}
      />
      { children }
    </div>
  );
}
