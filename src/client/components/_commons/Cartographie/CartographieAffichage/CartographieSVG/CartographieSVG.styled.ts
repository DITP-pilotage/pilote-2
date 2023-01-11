import styled from '@emotion/styled';

const CartographieSVGStyled = styled.div`
  position: relative;
  width: 100%;
  stroke: var(--grey-1000-50);

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
