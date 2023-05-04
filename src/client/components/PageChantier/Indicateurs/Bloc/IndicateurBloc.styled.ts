import styled from '@emotion/styled';

const IndicateurBlocStyled = styled.div`
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

export default IndicateurBlocStyled;
