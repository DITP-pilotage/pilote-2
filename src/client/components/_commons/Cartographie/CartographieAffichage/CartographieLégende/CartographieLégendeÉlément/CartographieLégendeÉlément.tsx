import CartographieLégendeÉlémentStyled
  from '@/components/_commons/Cartographie/CartographieAffichage/CartographieLégende/CartographieLégendeÉlément/CartographieLégendeÉlémentStyled';
import CartographieLégendeÉlémentProps
  from '@/components/_commons/Cartographie/CartographieAffichage/CartographieLégende/CartographieLégendeÉlément/CartographieLégendeÉlément.interface';

export default function CartographieLégendeÉlément({ couleur, libellé }: CartographieLégendeÉlémentProps) {
  return (
    <CartographieLégendeÉlémentStyled
      className='fr-pr-3v'
      couleur={couleur}
    >
      <div className="couleur fr-mr-1v" />
      <span>
        {libellé}
      </span>
    </CartographieLégendeÉlémentStyled>
  );
}
