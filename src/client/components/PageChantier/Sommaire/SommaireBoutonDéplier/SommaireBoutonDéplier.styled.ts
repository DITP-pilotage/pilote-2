import styled from '@emotion/styled';

const SommaireBoutonD√©plierStyled = styled.button`
  &:hover {
    background: none !important;
  }

  .ferm√©::before {
    transition: transform 0.1s linear;
    transform: rotate(0deg);
  }

  .ouvert::before {
    transition: transform 0.1s linear;
    transform: rotate(90deg);
  }
`;

export default SommaireBoutonD√©plierStyled;

