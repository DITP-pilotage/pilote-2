import styled from '@emotion/styled';

const CartographieSVGStyled = styled.div`
  position: relative;
  max-width: 30rem;
  margin: 0 auto;
  stroke: var(--grey-1000-50);

  .territoire-sélectionné {
    fill: none;
    stroke: var(--yellow-moutarde-850-200);
    stroke-width: 0.8;
  }

  .territoire-frontière {
    fill: none;
    stroke-width: 0.6;
  }

  .territoire-rempli {
    cursor: pointer;
    stroke-width: 0.2;

    &:hover {
      opacity: 0.72;
    }
  }
`;

export default CartographieSVGStyled;
