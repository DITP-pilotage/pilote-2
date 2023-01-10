import styled from '@emotion/styled';

const CartographieSVGStyled = styled.div`
  position: relative;
  width: 100%;

  .département {
    cursor: pointer;
    fill: #d0d0d0;
    stroke: #fff;

    &:hover {
      opacity: 0.72;
    }
  }

  .région {
    fill: none;        
    stroke: #FFFF;
    stroke-width: 0.8
  }
`;

export default CartographieSVGStyled;
