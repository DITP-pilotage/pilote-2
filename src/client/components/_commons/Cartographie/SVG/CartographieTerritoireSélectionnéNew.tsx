import { useRouter } from 'next/router';
import { territoiresComparésTerritoiresStore } from '@/client/stores/useTerritoiresStore/useTerritoiresStore';
import { CartographieTerritoires } from '@/components/_commons/Cartographie/useCartographie.interface';

export default function CartographieTerritoireSélectionné({ multiséléction, territoires }: {
  multiséléction: boolean,
  territoires: CartographieTerritoires['territoires']
}) {
  const territoiresComparés = territoiresComparésTerritoiresStore();
  const router = useRouter();

  const territoireCode = router.query.territoireCode as string;

  if (territoireCode === 'NAT-FR') {
    return null;
  }

  const [, codeInsee] = territoireCode.split('-');

  const territoireSélectionné = territoires.find(territoire => territoire.codeInsee === codeInsee);

  if (!territoireSélectionné) {
    return null;
  }

  return (
    <g>
      {multiséléction ?
        territoiresComparés.map(territoire => (
          <path
            className='territoire-sélectionné'
            d={territoire.tracéSvg}
            key={territoire.codeInsee}
          />
        )) :
        <path
          className='territoire-sélectionné'
          d={territoireSélectionné.tracéSVG}
          key={territoireSélectionné.codeInsee}
        />}
    </g>

  );
}
