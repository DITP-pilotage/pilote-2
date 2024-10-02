import { FunctionComponent, ReactNode, useState } from 'react';
import useCartographie from '@/components/_commons/Cartographie/useCartographie';
import {
  CartographieInfoBulle,
  CartographieOptions,
} from '@/components/_commons/Cartographie/useCartographie.interface';
import {
  départementsTerritoiresStore,
  mailleSélectionnéeTerritoiresStore,
} from '@/stores/useTerritoiresStore/useTerritoiresStore';
import { CodeInsee } from '@/server/domain/territoire/Territoire.interface';
import { CartographieDonnées } from './Cartographie.interface';
import BulleDInfo from './BulleDInfo/BulleDInfo';
import CartographieSVG from './SVG/CartographieSVG';

interface CartographieProps {
  options?: Partial<CartographieOptions>,
  données: CartographieDonnées,
  children?: ReactNode,
  auClicTerritoireCallback: (territoireCodeInsee: CodeInsee, territoireSélectionnable: boolean) => void,
}

const Cartographie: FunctionComponent<CartographieProps> = ({
  options,
  données,
  children,
  auClicTerritoireCallback,
}) => {
  const niveauDeMaille = mailleSélectionnéeTerritoiresStore();
  const départements = départementsTerritoiresStore();

  const { optionsParDéfaut, déterminerRégionsÀTracer, créerTerritoires } = useCartographie();

  const [sourisPosition, setSourisPosition] = useState({ x: 0, y: 0 });
  const [infoBulle, setInfoBulle] = useState<CartographieInfoBulle | null>(null);

  const optionsEffectives = { ...optionsParDéfaut, ...options };

  const régionsFiltrées = déterminerRégionsÀTracer(optionsEffectives.territoireAffiché);
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
        auClicTerritoireCallback={auClicTerritoireCallback}
        frontières={territoiresEtFrontières.frontières}
        infoBulle={infoBulle}
        options={optionsEffectives}
        setInfoBulle={setInfoBulle}
        territoires={territoiresEtFrontières.territoires}
      />
      {children}
    </div>
  );
};

export default Cartographie;
