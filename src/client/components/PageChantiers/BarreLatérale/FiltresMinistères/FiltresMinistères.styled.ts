import styled from '@emotion/styled';

const FiltresMinistèresStyled = styled.div`
  button {
    width: 100%;
    text-align: left;
  }

  ul {
    list-style-type: none;
  }

  ul.ministères-liste {
    overflow-y: auto;
  }

  ul.périmètres-liste {
    max-height: 0;
    overflow: hidden;
    transition: max-height 0.5s cubic-bezier(0, 1.05, 0, 1);
  }

  .ministère-déroulé + ul.périmètres-liste {
    max-height: 100vh;
    transition: max-height 2s;
  }

  .tuile,
  .fr-label.tuile { /* '.fr-label' permet d'override le DSFR en augmentant la priorité du sélecteur CSS */
    border-radius: 0.25rem;
  }

  .actif {
    font-weight: bold;
    color: var(--background-default-grey);
    background-color: var(--background-active-blue-france);
  }

  .actif:hover {
    background-color: var(--background-active-blue-france-hover);
  }
`;

export default FiltresMinistèresStyled;
