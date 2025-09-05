import styled from "@emotion/styled";

const PageChantierEnTêteStyled = styled.header`
  h1 {
    color: var(--text-title-blue-france);
  }

  .format-mobile {
    @media (max-width: 450px) {
      display: flex;
      flex-direction: column;
    }
  }

  .format-mobile-bouton-impression {
    @media (max-width: 450px) {
      width: 100%;
      margin-top: 16px;
    }
  }

  @media print {
    margin-top: 1rem;
  }

  .lien-menu {
    background-image: none;
  }
`;

export default PageChantierEnTêteStyled;
