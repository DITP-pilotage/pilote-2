import styled from '@emotion/styled';

type CartographieLégendeDégradéStyledProps = {
  couleurMax: string,
  couleurMin: string,
};

const CartographieLégendeDégradéStyled = styled.div<CartographieLégendeDégradéStyledProps>`
  max-width: 28rem;
  margin: auto;
  
  .dégradé-de-surface {
    height: 0.5rem;
    background: ${props => `linear-gradient(90deg, ${props.couleurMin}, ${props.couleurMax})`};
  }
`;

export default CartographieLégendeDégradéStyled;
