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
    background-color: var(--yellow-moutarde-975-75) !important;

    & .infobulle-bouton {
      min-height: 2rem;
      max-height: 2rem;
      padding-top: 0;
      color: var(--yellow-moutarde-main-679) !important;
    }

    & .bouton-proposition-valeur-davancement {
      color: var(--yellow-moutarde-main-679) !important;
      box-shadow: inset 0 0 0 1px var(--yellow-moutarde-main-679) !important;
    }

    & .texte-proposition {
      color: var(--yellow-moutarde-main-679) !important;

      & .indicateur-valeur,
      & .pourcentage {
        color: var(--yellow-moutarde-main-679) !important;
      }
    }
  }

  .fr-text-warning .infobulle-date-previsionnelle {
    color: var(--border-plain-warning) !important;
  }

  .texte-gris .infobulle-date-previsionnelle {
    color: var(--text-mention-grey) !important;
  }

  .infobulle-date-previsionnelle {
    position: relative;
    min-height: 0;
    padding: 0;

    button::before {
      --icon-size: 1.3rem !important;
    }
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
