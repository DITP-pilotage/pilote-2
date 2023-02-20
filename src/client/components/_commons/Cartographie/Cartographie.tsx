import { useState } from 'react';
import useCartographie from '@/components/_commons/Cartographie/useCartographie';
import { CartographieInfoBulle } from '@/components/_commons/Cartographie/useCartographie.interface';
import { départementsTerritoiresStore, mailleSélectionnéeTerritoiresStore } from '@/stores/useTerritoiresStore/useTerritoiresStore';
import CartographieProps from './Cartographie.interface';
import BulleDInfo from './BulleDInfo/BulleDInfo';
import CartographieLégende from './Légende/CartographieLégende';
import CartographieSVG from './SVG/CartographieSVG';

export default function Cartographie({ légende, options, données }: CartographieProps) {
  const niveauDeMaille = mailleSélectionnéeTerritoiresStore();
  const départements = départementsTerritoiresStore();

  const { optionsParDéfaut, déterminerRégionsÀTracer, créerTerritoires } = useCartographie();

  const [sourisPosition, setSourisPosition] = useState({ x: 0, y: 0 });
  const [infoBulle, setInfoBulle] = useState<CartographieInfoBulle | null>(null);

  const optionsEffectives = { ...optionsParDéfaut, ...options };

  const régionsFiltrées =  déterminerRégionsÀTracer(optionsEffectives.territoireAffiché);
  const territoiresÀTracer = niveauDeMaille === 'départementale' ? départements : régionsFiltrées;
  const frontièreÀTracer = niveauDeMaille === 'départementale' ? régionsFiltrées : [];
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
        frontières={territoiresEtFrontières.frontières}
        options={optionsEffectives}
        setInfoBulle={setInfoBulle}
        territoires={territoiresEtFrontières.territoires}
      />
      <CartographieLégende légende={légende} />
    </div>
  );
}
