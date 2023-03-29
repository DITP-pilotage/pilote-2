import styled from '@emotion/styled';

const PageLandingStyled = styled.main`
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

  .bloc-questions, .bloc-hero, .fr-card__img {
    background-color: var(--background-alt-blue-france);
  }

  .fr-btn {
    border-radius: 4px;
  }

  .fr-enlarge-link:hover {
    background-color: white;
  }
`;

export default PageLandingStyled;
