import { CartographieTerritoireSélectionnéProps } from '@/components/_commons/Cartographie/CartographieAffichage/SVG/CartographieTerritoireSélectionnéProps';

export default function CartographieTerritoireSélectionné( { territoire } : CartographieTerritoireSélectionnéProps) {
  return (
    <path
      className='territoire-sélectionné'
      d={territoire.tracéSVG}
      key={territoire.codeInsee}
    />
  );
}
