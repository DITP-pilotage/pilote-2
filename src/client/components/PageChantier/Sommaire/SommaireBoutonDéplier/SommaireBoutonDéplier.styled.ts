import styled from '@emotion/styled';

const SommaireBoutonDéplierStyled = styled.button`
  &:hover {
    background: none !important;
  }

  .fermé::before {
    transition: transform 0.1s linear;
    transform: rotate(0deg);
  }

  .ouvert::before {
    transition: transform 0.1s linear;
    transform: rotate(90deg);
  }
`;

export default SommaireBoutonDéplierStyled;

