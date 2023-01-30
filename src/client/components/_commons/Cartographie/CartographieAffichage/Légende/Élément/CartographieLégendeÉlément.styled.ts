import styled from '@emotion/styled';

type CartographieLégendeÉlémentStyledProps = {
  couleur: string,
};

const CartographieLégendeÉlémentStyled = styled.li<CartographieLégendeÉlémentStyledProps>`
  font-size: 0.75rem;
  line-height: 1rem;
  color: var(--text-mention-grey);

  .couleur {
    width: 0.5rem;
    height: 0.5rem;
    background-color: ${props => props.couleur};
    border: 1px solid #000;
  }
`;

export default CartographieLégendeÉlémentStyled;
