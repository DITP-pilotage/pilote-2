import styled from '@emotion/styled';

const PageLandingStyled = styled.main`
  h1 {
    color: #000 !important;
  }

  .conteneur-capture-pilote {
    display: flex;
    justify-content: center;
  }
  
  .conteneur-pictogramme {
    position: relative;
    height: 12.5rem; 
    background-color: var(--background-alt-grey);
  }

  .bloc-pilotage-ppg {
    background-color: var(--background-alt-grey);
  }

  .bloc-questions, .bloc-pour-qui {
    background-color: var(--background-default-grey);
  }

  .fr-btn {
    border-radius: 4px;
  }

  .fr-enlarge-link:hover {
    background-color: white;
  }

  .conteneur-contact {
    gap: 1rem;
  }
`;

export default PageLandingStyled;
