import { useRouter } from 'next/router';
import { parseAsString, useQueryState } from 'nuqs';
import { FunctionComponent } from 'react';
import { actionsTerritoiresStore } from '@/client/stores/useTerritoiresStore/useTerritoiresStore';
import { CartographieTerritoires } from '@/components/_commons/Cartographie/useCartographie.interface';
import { territoireCodeVersMailleCodeInsee } from '@/server/utils/territoires';
import { CartographieSVGContrat } from '@/server/cartographie/app/contrats/CartographieSVGContrat';
import { useCartographieSVG } from './useCartographieSVG';


// TODO refacto, mise en commun avec CartographieSVG.tsx
const getTraceSvg = function (svgAsJson: CartographieSVGContrat, territoireCode: string): string {
  const pathCorrespondantAuTerritoireCode = svgAsJson.svg.g.path.find(path => path['attr-territoire-code'] === territoireCode);
  return pathCorrespondantAuTerritoireCode?.['attr-d'] || '';
};

const CartographieTerritoireSélectionné: FunctionComponent<{
  multiséléction: boolean,
  territoires: CartographieTerritoires['territoires']
}> = ({
  multiséléction,
  territoires,
}) => {

  const { sourceSvgAsJson } = useCartographieSVG();

  const router = useRouter();
  const { récupérerDétailsSurUnTerritoire } = actionsTerritoiresStore();

  const [territoiresCompares] = useQueryState('territoiresCompares', parseAsString.withDefault(''));
  const territoireCode = router.query.territoireCode as string;

  const detailTerritoiresComparés = [territoireCode, ...territoiresCompares.split(',').filter(Boolean)].map(récupérerDétailsSurUnTerritoire);

  if (!multiséléction && territoireCode === 'NAT-FR') {
    return null;
  }

  const { codeInsee } = territoireCodeVersMailleCodeInsee(territoireCode);

  const territoireSélectionné = territoires.find(territoire => territoire.codeInsee === codeInsee);

  if (!multiséléction && !territoireSélectionné) {
    return null;
  }

  return (
    <g>
      {
        multiséléction ?
          detailTerritoiresComparés.map(territoire => (
            sourceSvgAsJson ? (
              <path
                className='territoire-sélectionné'
                d={getTraceSvg(sourceSvgAsJson, territoire.code)}
                key={territoire.codeInsee}
              />
            ) : null),
          ) : (
            sourceSvgAsJson ? (
              <path
                className='territoire-sélectionné'
                d={getTraceSvg(sourceSvgAsJson, territoireSélectionné!.code)}
                key={territoireSélectionné!.codeInsee}
              />
            ) : null)
      }
    </g>

  );
};

export default CartographieTerritoireSélectionné;
