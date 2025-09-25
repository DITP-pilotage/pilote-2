import styled from "@emotion/styled";

const IndicateurBlocStyled = styled.div`
  table .fr-select-group,
  table .fr-select {
    width: 3.2rem;
    padding: 0.2rem 0;
    margin: 0 !important;
    font-size: 0.875rem;
    font-weight: bold;
    color: var(--text-title-grey);
    background-position: 100% 70% !important;
  }

  table.fr-table tbody tr {
    background-color: transparent;
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

  .ligne-creation-proposition-valeur-davancement,
  .ligne-territoire-proposition-valeur-davancement {
    background-color: transparent !important;
  }

  tr.ligne-modification-proposition-valeur-davancement {
    & .infobulle-bouton {
      min-height: 2rem;
      max-height: 2rem;
      padding-top: 0;
      color: currentColor !important;
    }

    & .bouton-proposition-valeur-davancement {
      color: currentColor !important;
      box-shadow: inset 0 0 0 1px currentColor !important;
    }

    & .texte-proposition {
      color: currentColor !important;

      & .indicateur-valeur,
      & .pourcentage {
        color: currentColor !important;
      }
    }
  }

  .texte-jaune {
    color: var(--yellow-moutarde-main-679) !important;
  }

  .indicateur-date-valeur {
    height: 1rem;
    font-size: 0.625rem;
    line-height: 1rem;
  }

  tr.table-comparaison-border {
    border-top: 1px solid #ddd;
  }
`;

export default IndicateurBlocStyled;
