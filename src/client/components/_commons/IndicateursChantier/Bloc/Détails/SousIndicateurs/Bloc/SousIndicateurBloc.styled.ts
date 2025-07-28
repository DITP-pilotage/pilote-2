import styled from "@emotion/styled";

const SousIndicateurBlocStyled = styled.div`
  .fr-select-group,
  .fr-select {
    width: 3.2rem;
    padding: 0.2rem 0;
    margin: 0 !important;
    font-size: 0.875rem;
    font-weight: bold;
    color: var(--text-title-grey);
    background-position: 100% 70% !important;
  }

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
