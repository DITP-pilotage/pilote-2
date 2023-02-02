import styled from '@emotion/styled';

const FiltresMinistèresStyled = styled.div`
  button {
    text-align: left;
  }

  ul {
    padding: 0;
    margin: 0 0 1rem;
    list-style-type: none;
  }

  ul.ministères-liste {
    max-height: 350px;
    margin-left: 0.5rem;
    overflow-y: auto;
  }

  ul.périmètres-liste > li {
    padding: 0;
    margin: 0.5rem 0 0.5rem 2rem;
  }

  ul.périmètres-liste {
    display: none;
  }

  .ministère-déroulé + ul.périmètres-liste {
    display: block;
  }

  .tuile,
  .fr-label.tuile { /* '.fr-label' permet d'override le DSFR en augmentant la priorité du sélecteur CSS */
    margin-left: 0;
    border-radius: 0.25rem;
  }

  .fr-label.tuile::before { /* ::before correspond à la checkbox du DSFR */
    display: none;
  }

  .ministère-sélectionné,
  .fr-checkbox-group input[type="checkbox"]:checked + .fr-label.tuile {
    font-weight: bold;
    color: var(--background-default-grey);
    background-color: var(--background-active-blue-france) !important;
  }
`;

export default FiltresMinistèresStyled;
