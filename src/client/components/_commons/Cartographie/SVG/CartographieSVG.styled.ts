import styled from '@emotion/styled';

const CartographieSVGStyled = styled.div`
  position: relative;

  .carte {
    max-width: 25rem;
    margin: auto;
    stroke: var(--grey-1000-50);

    .territoire-sélectionné {
      fill: none;
      stroke: var(--yellow-moutarde-850-200);
      stroke-width: 0.5;
    }

    .territoire-frontière {
      fill: none;
      stroke-width: 0.4;
    }

    .territoire-rempli {
      stroke-width: 0.15;

      &:hover {
        opacity: 0.72;
      }
    }

    .territoire-interactif {
      cursor: pointer;
    }
  }
`;

export default CartographieSVGStyled;
