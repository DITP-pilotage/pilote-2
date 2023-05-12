import { territoiresComparésTerritoiresStore, territoireSélectionnéTerritoiresStore } from '@/client/stores/useTerritoiresStore/useTerritoiresStore';

export default function CartographieTerritoireSélectionné({ multiséléction }: { multiséléction: boolean }) {
  const territoireSélectionné = territoireSélectionnéTerritoiresStore();
  const territoiresComparés = territoiresComparésTerritoiresStore();

  if (territoireSélectionné === null) return null;

  return (
    <g>
      { multiséléction ?
        territoiresComparés.map(territoire => (
          <path
            className='territoire-sélectionné'
            d={territoire.tracéSvg}
            key={territoire.codeInsee}
          />
        )) :
        <path
          className='territoire-sélectionné'
          d={territoireSélectionné.tracéSvg}
          key={territoireSélectionné.codeInsee}
        />}
    </g>

  );
}
