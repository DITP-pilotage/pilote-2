import { useRouter } from 'next/router';
import { parseAsString, useQueryState } from 'nuqs';
import { actionsTerritoiresStore } from '@/client/stores/useTerritoiresStore/useTerritoiresStore';
import { CartographieTerritoires } from '@/components/_commons/Cartographie/useCartographie.interface';
import { territoireCodeVersMailleCodeInsee } from '@/server/utils/territoires';

const CartographieTerritoireSélectionné = ({
  multiséléction,
  territoires,
}: {
  multiséléction: boolean,
  territoires: CartographieTerritoires['territoires']
}) => {
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
            <path
              className='territoire-sélectionné'
              d={territoire.tracéSvg}
              key={territoire.codeInsee}
            />
          )) : (
            <path
              className='territoire-sélectionné'
              d={territoireSélectionné!.tracéSVG}
              key={territoireSélectionné!.codeInsee}
            />
          )
      }
    </g>

  );
};

export default CartographieTerritoireSélectionné;
