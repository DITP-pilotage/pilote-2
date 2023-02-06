import styled from '@emotion/styled';

const CartographieZoomEtDéplacementStyled = styled.div`
  position: absolute;
  right: 0;
  min-width: 2rem;

  button {
    display: block;
    width: 100%;
    min-height: 1.8rem;
    padding: 0;
    color: var(--blue-france-sun-113-625);
    background: #fff;
    border: solid 2px #cecece;
    box-shadow: 0 1px 1px rgb(0 0 0 / 16%), 0 1px 0 -2px rgb(0 0 0 / 16%), 0 1px 4px rgb(0 0 0 / 23%);
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
