import styled from '@emotion/styled';

type CartographieLégendeÉlémentStyledProps = {
  couleur: string,
};

const CartographieLégendeÉlémentStyled = styled.li<CartographieLégendeÉlémentStyledProps>`
  font-size: 0.625rem;
  line-height: 1rem;
  color: var(--text-mention-grey);
  
  .couleur {
    height: 0.5rem;
    width: 0.5rem;
    border: 1px solid #000;
    background-color: ${props => props.couleur};
  }
`;

export default CartographieLégendeÉlémentStyled;
