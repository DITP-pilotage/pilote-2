import { FunctionComponent, memo, useEffect, useRef, useState } from 'react';
import hachuresGrisBlanc from '@/client/constants/légendes/hachure/hachuresGrisBlanc';
import {
  CartographieOptions,
  CartographieTerritoires,
  CartographieInfoBulle,
} from '@/components/_commons/Cartographie/useCartographie.interface';
import { CodeInsee } from '@/server/domain/territoire/Territoire.interface';
import { CartographieSVGContrat } from '@/server/cartographie/app/contrats/CartographieSVGContrat';
import { Viewbox } from './CartographieSVG.interface';
import CartographieZoomEtDéplacement from './ZoomEtDéplacement/CartographieZoomEtDéplacement';
import CartographieSVGStyled from './CartographieSVG.styled';
import CartographieTerritoireSélectionné from './CartographieTerritoireSélectionné';
import { useCartographieSVG } from './useCartographieSVG';

interface CartographieSVGProps {
  options: CartographieOptions,
  territoires: CartographieTerritoires['territoires'],
  frontières: CartographieTerritoires['frontières'],
  setInfoBulle:  (state: CartographieInfoBulle | null) => void,
  auClicTerritoireCallback: (territoireCodeInsee: CodeInsee, territoireSélectionnable: boolean) => void,
}

const getTraceSvg = function (svgAsJson: { svg: { g: { path: { 'attr-d': string, 'attr-territoire-code': string }[] } } },  territoireCode: string): string {
  const pathCorrespondantAuTerritoireCode = svgAsJson.svg.g.path.find(path => path['attr-territoire-code'] === territoireCode);
  return pathCorrespondantAuTerritoireCode?.['attr-d'] || '';
};

const CartographieSVG: FunctionComponent<CartographieSVGProps> = ({
  options,
  territoires,
  frontières,
  setInfoBulle,
  auClicTerritoireCallback,
}) => {

  const [stateSVG, setStateSVG] = useState<CartographieSVGContrat | null>(null);
  const { sourceSvgAsJson } = useCartographieSVG();

  useEffect(() => {
    setStateSVG(sourceSvgAsJson || null);
  }, [sourceSvgAsJson]);

  const svgRef = useRef<SVGSVGElement | null>(null);
  const [viewbox, setViewbox] = useState<Viewbox>({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });

  useEffect(() => {
    if (svgRef?.current?.getBBox) {
      setViewbox(svgRef.current.getBBox());
    }
  }, [svgRef]);


  return (
    <CartographieSVGStyled>
      {
        options.estInteractif ? (
          <CartographieZoomEtDéplacement
            svgRef={svgRef}
            viewbox={viewbox}
          />
        ) : null
      }
      <div className='carte'>
        <svg
          ref={svgRef}
          version='1.2'
          viewBox={`
          ${viewbox.x}
          ${viewbox.y}
          ${viewbox.width}
          ${viewbox.height}
        `}
          xmlns='http://www.w3.org/2000/svg'
        >
          <defs>
            {hachuresGrisBlanc.patternSVG}
          </defs>
          <g
            className='canvas'
            onMouseLeave={() => {
              setInfoBulle(null);
            }}
          >
            {
              territoires.map(territoire => (
                stateSVG ? (
                  <path 
                    className={`territoire-rempli ${(options.estInteractif && territoire.estInteractif) && 'territoire-interactif'}`}
                    d={getTraceSvg(stateSVG, territoire.code)}
                    fill={territoire.remplissage}
                    key={`territoire-${territoire.codeInsee}`}
                    onClick={() => options.estInteractif && territoire.estInteractif && auClicTerritoireCallback(territoire.codeInsee, options.territoireSélectionnable)}
                    onMouseEnter={() => {
                      if (options.estInteractif) {
                        setInfoBulle({
                          libellé: territoire.libellé,
                          valeurAffichée: territoire.valeurAffichée,
                        });
                      } else {
                        setInfoBulle(null);
                      }
                    }}
                  />
                ) : null),
              )
            }
            {
              frontières.map(frontière => (
                <path
                  className='territoire-frontière'
                  d={frontière.tracéSVG}
                  key={`frontière-${frontière.codeInsee}`}
                />
              ))
            }
            {
              options.territoireSélectionnable ? (
                <CartographieTerritoireSélectionné
                  multiséléction={options.multiséléction}
                  territoires={territoires}
                />
              ) : null
            }
          </g>
        </svg>
      </div>
    </CartographieSVGStyled>
  );
};

export default memo(CartographieSVG, (prevProps, nextProps) => (
  prevProps.territoires === nextProps.territoires &&
  prevProps.frontières === nextProps.frontières &&
  prevProps.setInfoBulle === nextProps.setInfoBulle
));
