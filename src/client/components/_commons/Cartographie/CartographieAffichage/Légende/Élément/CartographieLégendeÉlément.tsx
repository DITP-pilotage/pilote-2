import CartographieLégendeÉlémentStyled from './CartographieLégendeÉlément.styled';
import CartographieLégendeÉlémentProps from './CartographieLégendeÉlément.interface';

export default function CartographieLégendeÉlément({ children, couleur }: CartographieLégendeÉlémentProps) {
  return (
    <CartographieLégendeÉlémentStyled
      className='fr-pr-3v'
      couleur={couleur}
    >
      <div className="couleur fr-mr-1v" />
      { children }
    </CartographieLégendeÉlémentStyled>
  );
}
