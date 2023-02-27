import styled from '@emotion/styled';

type CartographieLégendeDégradéDeSurfaceStyledProps = {
  couleurMax: string,
  couleurMin: string,
};

const CartographieLégendeDégradéDeSurfaceStyled = styled.div<CartographieLégendeDégradéDeSurfaceStyledProps>`
  max-width: 28rem;
  margin: auto;
  
  .dégradé-de-surface {
    height: 0.5rem;
    background: ${props => `linear-gradient(90deg, ${props.couleurMin}, ${props.couleurMax})`};
  }
`;

export default CartographieLégendeDégradéDeSurfaceStyled;
