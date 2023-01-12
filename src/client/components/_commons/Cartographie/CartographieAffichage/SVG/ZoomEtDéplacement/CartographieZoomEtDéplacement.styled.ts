import styled from '@emotion/styled';

const CartographieZoomEtDéplacementStyled = styled.div`
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  width: 2rem;

  button {
    display: block;
    width: 2rem;
    padding: 0;
    color: var(--blue-france-sun-113-625);
    text-align: center;
    background: #fff;
    border: solid 2px #cecece;
  }

  button:hover {
    background-color: #fff;
  }

  button.zoom-plus {
    border-bottom-width: 1px;
    border-radius: 0.5rem 0.5rem 0 0;
  }

  button.zoom-moins {
    border-top-width: 1px;
    border-radius: 0 0 0.5rem 0.5rem;
  }
`;

export default CartographieZoomEtDéplacementStyled;
