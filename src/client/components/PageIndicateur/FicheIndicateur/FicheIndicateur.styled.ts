import styled from "@emotion/styled";

const FicheIndicateurStyled = styled.div`
  .titre-input-metadata {
    margin: 0;
  }

  .infobulle {
    line-height: 0;

    .infobulle-texte {
      line-height: 1.5rem;
    }
  }

  .infobulle-bouton {
    min-height: 0;
    padding: 0;

    &::before {
      min-height: 0;
    }
  }

  .bouton-retour {
    &::before {
      margin-right: 0.625rem;

      --icon-size: 0.875rem;
    }

    color: var(--text-action-high-blue-france);
    background: none;
  }
`;

export default FicheIndicateurStyled;
