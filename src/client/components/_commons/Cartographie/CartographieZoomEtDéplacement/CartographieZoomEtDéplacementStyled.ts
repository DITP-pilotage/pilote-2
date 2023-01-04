import styled from '@emotion/styled';

const CartographieZoomEtDéplacementStyled = styled.div`
  position: absolute;
  right: 0.5rem;
  top: 0.5rem;
  width: 2rem;
  
  button {
    display: block;
    padding: 0;
    text-align: center;
    width: 2rem;
    border: solid 2px #CECECE;
    background: #fff;
    color: var(--blue-france-sun-113-625);
  }
  
  button:hover {
    background-color: #fff;
  }

  button.zoom-plus {
    border-radius: 0.5rem 0.5rem 0 0;
    border-bottom-width: 1px;
  }

  button.zoom-moins {
    border-radius: 0 0 0.5rem 0.5rem;
    border-top-width: 1px;
  }
`;

export default CartographieZoomEtDéplacementStyled;
