import CartographieLégendeÉlémentStyled from './CartographieLégendeÉlément.styled';
import CartographieLégendeÉlémentProps from './CartographieLégendeÉlément.interface';

export default function CartographieLégendeÉlément({ children, couleur, hachures }: CartographieLégendeÉlémentProps) {
  return (
    <CartographieLégendeÉlémentStyled
      className='fr-pr-3v fr-pb-1v texte-gris'
      couleur={couleur}
    > 
      <div className={`${hachures && 'hachures'} couleur fr-mr-1v`} />
      { children }
    </CartographieLégendeÉlémentStyled>
  );
}
