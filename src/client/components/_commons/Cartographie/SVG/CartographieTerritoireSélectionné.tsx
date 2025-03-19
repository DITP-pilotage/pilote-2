import { parseAsString, useQueryState } from 'nuqs';
import { FunctionComponent } from 'react';
import { actionsTerritoiresStore } from '@/client/stores/useTerritoiresStore/useTerritoiresStore';
import { CartographieSVGContrat } from '@/server/cartographie/app/contrats/CartographieSVGContrat';
import { useCartographieSVG } from './useCartographieSVG';

// TODO refacto, mise en commun avec CartographieSVG.tsx
const getTraceSvg = function (svgAsJson: CartographieSVGContrat, territoireCode: string): string {
  const pathCorrespondantAuTerritoireCode = svgAsJson.svg.g.path.find(path => path['attr-territoire-code'] === territoireCode);
  return pathCorrespondantAuTerritoireCode?.['attr-d'] || '';
};

export const CartographieTerritoireSélectionné: FunctionComponent<{ territoireCode: string }> = ({ territoireCode }) => {

  const { sourceSvgAsJson } = useCartographieSVG();

  const { récupérerDétailsSurUnTerritoire } = actionsTerritoiresStore();

  const [territoiresCompares] = useQueryState('territoiresCompares', parseAsString.withDefault(''));

  const detailTerritoiresComparés = [territoireCode, ...territoiresCompares.split(',').filter(Boolean)].map(récupérerDétailsSurUnTerritoire);

  return (
    <g>
      {
        territoiresCompares.length > 0 ?
          detailTerritoiresComparés.map(territoire => (
            sourceSvgAsJson ? (
              <path
                className='territoire-sélectionné'
                d={getTraceSvg(sourceSvgAsJson, territoire.code)}
                key={territoire.code}
              />
            ) : null),
          ) : (
            sourceSvgAsJson ? (
              <path
                className='territoire-sélectionné'
                d={getTraceSvg(sourceSvgAsJson, territoireCode)}
                key={territoireCode}
              />
            ) : null)
      }
    </g>

  );
};
