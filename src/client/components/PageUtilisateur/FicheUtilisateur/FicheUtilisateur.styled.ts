import styled from "@emotion/styled";

const FicheUtilisateurStyled = styled.div`
  h1,
  h2 {
    color: var(--text-title-blue-france);
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

export default FicheUtilisateurStyled;
