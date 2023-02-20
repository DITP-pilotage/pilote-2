import { territoireSélectionnéTerritoiresStore } from '@/client/stores/useTerritoiresStore/useTerritoiresStore';

export default function CartographieTerritoireSélectionné() {
  const territoireSélectionné = territoireSélectionnéTerritoiresStore();

  if (territoireSélectionné.codeInsee === 'FR') return null;

  return (
    <path
      className='territoire-sélectionné'
      d={territoireSélectionné.tracéSVG}
    />
  );
}
