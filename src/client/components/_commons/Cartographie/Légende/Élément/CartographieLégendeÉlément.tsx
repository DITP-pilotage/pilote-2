import CartographieLégendeÉlémentStyled from './CartographieLégendeÉlément.styled';
import CartographieLégendeÉlémentProps from './CartographieLégendeÉlément.interface';

const miseÀLÉchelle = 2.75; // sert pour faire correspondre la taille des hachures sur la carte et dans la légende

export default function CartographieLégendeÉlément({ children, remplissage }: CartographieLégendeÉlémentProps) {
  return (
    <CartographieLégendeÉlémentStyled
      className='fr-pr-3v fr-pb-1v texte-gris'
    >
      <svg
        className="fr-mr-1v remplissage"
        version="1.2"
        viewBox={`0 0 ${miseÀLÉchelle} ${miseÀLÉchelle}`}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          { remplissage.type === 'HACHURES' && remplissage.hachure.patternSVG }
        </defs>
        <rect
          fill={remplissage.couleur}
          height={miseÀLÉchelle}
          width={miseÀLÉchelle}
          x={0}
          y={0}
        />
      </svg>
      { children }
    </CartographieLégendeÉlémentStyled>
  );
}
