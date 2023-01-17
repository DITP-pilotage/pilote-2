import {
  CartographieTerritoireSélectionnéProps,
} from '@/components/_commons/Cartographie/CartographieAffichage/SVG/CartographieTerritoireSélectionnéProps';

export default function CartographieTerritoireSélectionné( { territoire } : CartographieTerritoireSélectionnéProps) {
  return (
    territoire
      ?
        <path
          className='territoire-sélectionné'
          d={territoire.tracéSVG}
          key={territoire.codeInsee}
        />
      : null
  );
}
