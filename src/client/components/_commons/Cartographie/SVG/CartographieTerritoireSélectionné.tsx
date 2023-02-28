import { territoiresComparésTerritoiresStore, territoireSélectionnéTerritoiresStore } from '@/client/stores/useTerritoiresStore/useTerritoiresStore';

export default function CartographieTerritoireSélectionné({ multiséléction }: { multiséléction: boolean }) {
  const territoireSélectionné = territoireSélectionnéTerritoiresStore();
  const territoiresComparés = territoiresComparésTerritoiresStore();

  return (
    <g>
      { multiséléction === true &&
        territoiresComparés.map(territoire => (
          <path
            className='territoire-sélectionné'
            d={territoire.tracéSVG}
            key={territoire.codeInsee}
          />
        ))}
      <path
        className='territoire-sélectionné'
        d={territoireSélectionné.tracéSVG}
        key={territoireSélectionné.codeInsee}
      />
    </g>

  );
}
