import styled from '@emotion/styled';

const InfobulleStyled = styled.div`
  display: inline-block;
  vertical-align: -0.3em;
  
  .bouton:hover,
  .bouton:active {
    background-color: initial;
  }

  .infobulle-texte {
    position: absolute;
    right: 0;
    left: 0;
    z-index: 2;
    display: none;
    max-width: 30rem;
    padding: 0.5rem;
    background-color: var(--info-950-100);
    border: 1px solid var(--border-disabled-grey);
    border-radius: 0.5rem;
    box-shadow: 0 4px 2px #0002;
  }

  &:hover {
    .infobulle-texte {
      display: block;
    }
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
`;

export default InfobulleStyled;
