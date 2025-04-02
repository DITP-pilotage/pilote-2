import { FunctionComponent, useRef, useState } from 'react';
import { CodeInsee } from '@/server/domain/territoire/Territoire.interface';
import hachuresGrisBlanc from '@/client/constants/légendes/hachure/hachuresGrisBlanc';
import {
  CartographieOptions,
  CartographieTerritoires,
  CartographieTerritoire,
} from '@/components/_commons/Cartographie/useCartographie.interface';
import { CartographieSVGContrat } from '@/server/cartographie/app/contrats/CartographieSVGContrat';
import SecureTooltip from '@/components/_commons/SecureTooltip/SecureTooltip';
import CartographieZoomEtDéplacement from './ZoomEtDéplacement/CartographieZoomEtDéplacement';
import CartographieSVGStyled from './CartographieSVG.styled';
import { CartographieTerritoireSélectionné } from './CartographieTerritoireSélectionné';
import { useCartographieSVG } from './useCartographieSVG';

interface CartographieSVGProps {
  territoireCode: string,
  options: CartographieOptions,
  territoires: CartographieTerritoires['territoires'],
  frontières: CartographieTerritoires['frontières'],
  auClicTerritoireCallback: (territoireCodeInsee: CodeInsee, territoireSélectionnable: boolean) => void,
  contoursGris?: boolean,
  hasTooltip: boolean
}

const getTraceSvg = function (svgAsJson: CartographieSVGContrat, territoireCode: string): string {
  const pathCorrespondantAuTerritoireCode = svgAsJson.svg.g.path.find(path => path['attr-territoire-code'] === territoireCode);
  return pathCorrespondantAuTerritoireCode?.['attr-d'] || '';
};

export const CartographieSVG: FunctionComponent<CartographieSVGProps> = ({
  territoireCode,
  options,
  territoires,
  frontières,
  auClicTerritoireCallback,
  contoursGris = false,
  hasTooltip,
}) => {

  const { sourceSvgAsJson } = useCartographieSVG();

  const [hoveredTerritoire, setHoveredTerritoire] = useState<CartographieTerritoire | null>(null);
  const [hoveredElement, setHoveredElement] = useState<HTMLElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const viewbox = {
    x: 1,
    y: 0,
    width: 100,
    height: 100,
  };

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
      <div className={`carte ${contoursGris ? 'stroke-dark' : ''}`}>
        {
          hasTooltip ? (
            <SecureTooltip
              anchorEl={hoveredElement}
              classNameInfoBulle='infobull--sm'
              isVisible={!!hoveredTerritoire}
            >
              {hoveredTerritoire ? (
                <div className='fr-text--sm'>
                  <p className='fr-text--sm fr-background-contrast-grey fr-p-2w'>
                    {hoveredTerritoire.libellé}
                  </p>
                  <div className='fr-text--sm fr-p-2w'>
                    {hoveredTerritoire.contenuInfoBulle}
                  </div>
                </div>
              ) : null}
            </SecureTooltip>
          ) : null
        }
        <svg
          ref={svgRef}
          version='1.2'
          viewBox='1 0 100 100'
          xmlns='http://www.w3.org/2000/svg'
        >
          <defs>
            {hachuresGrisBlanc.patternSVG}
          </defs>
          <g
            className='canvas'
          >
            {
              territoires.map(territoire => (
                sourceSvgAsJson ? (
                  <path
                    className={`territoire-rempli ${(options.estInteractif && territoire.estInteractif && territoire.estApplicable) && 'territoire-interactif'}`}
                    d={getTraceSvg(sourceSvgAsJson, territoire.code)}
                    fill={territoire.remplissage}
                    key={`territoire-${territoire.codeInsee}`}
                    onClick={() => territoire.estApplicable && options.estInteractif && territoire.estInteractif && auClicTerritoireCallback(territoire.code, options.territoireSélectionnable)}
                    onMouseEnter={(e) => {
                      if (options.estInteractif) {
                        setHoveredTerritoire(territoire);
                        setHoveredElement(e.currentTarget as unknown as HTMLElement);
                      }
                    }}
                    onMouseLeave={() => {
                      setHoveredTerritoire(null);
                      setHoveredElement(null);
                    }}
                  />
                ) : null),
              )
            }
            {
              frontières.map(frontière => (
                sourceSvgAsJson ? (
                  <path
                    className='territoire-frontière'
                    d={getTraceSvg(sourceSvgAsJson, frontière.code)}
                    key={`frontière-${frontière.codeInsee}`}
                  />
                ) : null),
              )
            }
            {
              options.territoireSélectionnable ? (
                <CartographieTerritoireSélectionné territoireCode={territoireCode} />
              ) : null
            }
          </g>
        </svg>
      </div>
    </CartographieSVGStyled>
  );
};
