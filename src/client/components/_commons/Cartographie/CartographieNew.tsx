import { FunctionComponent, ReactNode, useState } from 'react';
import useCartographie from '@/components/_commons/Cartographie/useCartographieNew';
import {
  CartographieInfoBulle,
  CartographieOptions,
} from '@/components/_commons/Cartographie/useCartographie.interface';
import {
  départementsTerritoiresStore,
} from '@/stores/useTerritoiresStore/useTerritoiresStore';
import { CodeInsee } from '@/server/domain/territoire/Territoire.interface';
import { MailleInterne } from '@/server/domain/maille/Maille.interface';
import BulleDInfo from './BulleDInfo/BulleDInfo';
import { CartographieSVG } from './SVG/CartographieSVG';

type CartographieDonnées = {
  [key in CodeInsee]: {
    contenu: ReactNode,
    remplissage: string,
    libellé: string
    estApplicable: boolean | null
  }
};

interface CartographieProps {
  options?: Partial<CartographieOptions>,
  données: CartographieDonnées,
  pathname: '/accueil/chantier/[territoireCode]' | '/chantier/[id]/[territoireCode]' | null,
  children?: ReactNode,
  territoireCode: string,
  mailleSelectionnee: MailleInterne,
  auClicTerritoireCallback: (territoireCodeInsee: CodeInsee, territoireSélectionnable: boolean) => void,
  contoursGris? : boolean
}

const Cartographie: FunctionComponent<CartographieProps> = ({
  options,
  données,
  children,
  auClicTerritoireCallback,
  territoireCode,
  pathname,
  mailleSelectionnee,
  contoursGris = false,
}) => {
  const départements = départementsTerritoiresStore();
  const {
    optionsParDéfaut,
    déterminerRégionsÀTracer,
    créerTerritoires,
  } = useCartographie(territoireCode, pathname);

  const territoireCodeAAfficher = territoireCode;

  const [sourisPosition, setSourisPosition] = useState({ x: 0, y: 0 });
  const [infoBulle, setInfoBulle] = useState<CartographieInfoBulle | null>(null);

  const optionsEffectives = { ...optionsParDéfaut, ...options };

  const régionsFiltrées = déterminerRégionsÀTracer(optionsEffectives.territoireAffiché);
  const territoiresÀTracer = mailleSelectionnee === 'departementale' ? départements : régionsFiltrées;
  const frontièreÀTracer = mailleSelectionnee === 'departementale' ? régionsFiltrées : [];
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
            titre={infoBulle.libellé}
            x={sourisPosition.x}
            y={sourisPosition.y}
          >
            {infoBulle.contenu}
          </BulleDInfo>
          : null
      }
      <CartographieSVG
        auClicTerritoireCallback={auClicTerritoireCallback}
        contoursGris={contoursGris}
        frontières={territoiresEtFrontières.frontières}
        infoBulle={infoBulle}
        options={optionsEffectives}
        setInfoBulle={setInfoBulle}
        territoireCode={territoireCodeAAfficher}
        territoires={territoiresEtFrontières.territoires}
      />
      {children}
    </div>
  );
};

export default Cartographie;
