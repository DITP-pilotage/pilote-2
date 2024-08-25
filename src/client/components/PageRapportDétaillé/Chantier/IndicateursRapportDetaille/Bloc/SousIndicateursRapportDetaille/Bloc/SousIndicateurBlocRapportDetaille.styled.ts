import styled from '@emotion/styled';

const SousIndicateurBlocStyled = styled.div`
  &:last-of-type {
    margin-bottom: 0 !important;
  }
  
  td {
    min-height: 2rem;
    vertical-align: top;
  }

  .indicateur-valeur,
  .indicateur-date-valeur {
    font-size: inherit;
  }

  .indicateur-date-valeur {
    height: 1rem;
    font-size: 0.625rem;
    line-height: 1rem;
  }
`;

export default SousIndicateurBlocStyled;
