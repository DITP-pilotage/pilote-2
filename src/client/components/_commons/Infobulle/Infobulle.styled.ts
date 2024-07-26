import styled from '@emotion/styled';

const InfobulleStyled = styled.div`
  display: inline-block;
  height: 1.4rem;
  color: var(--text-title-grey);
  vertical-align: -0.3em;
  
  .infobulle-bouton:hover,
  .infobulle-bouton:active {
    background-color: initial;
  }

  .infobulle-texte {
    position: absolute;
    right: 0;
    left: 0;
    z-index: 2;
    min-width: 25rem;
    max-width: 30rem;
    padding: 0.5rem;
    background-color: var(--background-alt-blue-france);
    border: 1px solid var(--background-action-high-blue-france);
    border-radius: 0.5rem;
    box-shadow: 0 4px 2px #0002;
  }

  p {
    margin-bottom: 0.5rem;
  }

  p:last-of-type {
    margin-bottom: 0;
  }

  @media (min-width: 576px) {
    .infobulle-texte {
      right: 1rem;
      left: 1rem;
    }
  }

  .liste-niveau2 {
    list-style-type: square;
  }
`;

export default InfobulleStyled;
