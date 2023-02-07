import CartographieLégendeÉlémentStyled from './CartographieLégendeÉlément.styled';
import CartographieLégendeÉlémentProps from './CartographieLégendeÉlément.interface';

export default function CartographieLégendeÉlément({ children, remplissage }: CartographieLégendeÉlémentProps) {
  return (
    <CartographieLégendeÉlémentStyled
      className='fr-pr-3v fr-pb-1v texte-gris'
      couleurDeRemplissage={remplissage.type === 'COULEUR' ? remplissage.valeur : undefined}
    > 
      <div
        className={`
          fr-mr-1v
          remplissage
          ${remplissage.type === 'HACHURES' ? 'hachures' : 'couleur'}
        `}
      />
      { children }
    </CartographieLégendeÉlémentStyled>
  );
}
