import styled from '@emotion/styled';

const InfobulleStyled = styled.div`
  display: inline-block;
  vertical-align: -0.2em;
  
  .bouton:hover,
  .bouton:active {
    background-color: initial;
  }

  .infobulle-texte {
    position: absolute;
    z-index: 2;
    display: none;
    width: 30rem;
    padding: 0.5rem;
    background-color: var(--info-950-100);
    border: 1px solid var(--border-disabled-grey);
    border-radius: 0.5rem;
    box-shadow: 0 4px 2px #0002;
    transform: translateX(calc(40px - 100%));
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

  @media (width < 992px) {
    .infobulle-texte {
      position: absolute;
      right: 4rem;
      left: 4rem;
      width: unset;
      max-width: 30rem;
      transform: translateX(0);
    }
  }

  @media (width < 576px) {
    .infobulle-texte {
      right: 1rem;
      left: 1rem;
    }
  }
`;

export default InfobulleStyled;
