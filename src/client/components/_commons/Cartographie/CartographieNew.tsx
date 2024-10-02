import { FunctionComponent, ReactNode, useState } from 'react';
import useCartographie from '@/components/_commons/Cartographie/useCartographieNew';
import {
  CartographieInfoBulle,
  CartographieOptions,
} from '@/components/_commons/Cartographie/useCartographie.interface';
import { départementsTerritoiresStore } from '@/stores/useTerritoiresStore/useTerritoiresStore';
import { CodeInsee } from '@/server/domain/territoire/Territoire.interface';
import BulleDInfo from './BulleDInfo/BulleDInfo';
import CartographieSVG from './SVG/CartographieSVG';

type CartographieDonnées = {
  [key in CodeInsee]: {
    valeurAffichée: string,
    remplissage: string,
    libellé: string
  }
};

interface CartographieProps {
  options?: Partial<CartographieOptions>,
  données: CartographieDonnées,
  pathname: '/accueil/chantier/[territoireCode]' | '/chantier/[id]/[territoireCode]' | null,
  children?: ReactNode,
  territoireCode: string,
  mailleSelectionnee: 'départementale' | 'régionale',
  auClicTerritoireCallback: (territoireCodeInsee: CodeInsee, territoireSélectionnable: boolean) => void,
}

const Cartographie: FunctionComponent<CartographieProps> = ({
  options,
  données,
  children,
  auClicTerritoireCallback,
  territoireCode,
  mailleSelectionnee,
  pathname,
}) => {
  const départements = départementsTerritoiresStore();

  const {
    optionsParDéfaut,
    déterminerRégionsÀTracer,
    créerTerritoires,
  } = useCartographie(territoireCode, mailleSelectionnee, pathname);

  const [sourisPosition, setSourisPosition] = useState({ x: 0, y: 0 });
  const [infoBulle, setInfoBulle] = useState<CartographieInfoBulle | null>(null);

  const optionsEffectives = { ...optionsParDéfaut, ...options };

  const régionsFiltrées = déterminerRégionsÀTracer(optionsEffectives.territoireAffiché);
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
