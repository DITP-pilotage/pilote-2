import styled from '@emotion/styled';

const FiltresMinistèresStyled = styled.div`
  ul {
    padding: 0;
    margin: 0 0 1rem;
    list-style-type: none;
  }

  ul.fitres-liste > li {
    padding: 0;
    margin: 0.5rem 0 0.5rem 2rem;
  }

  .choix-filtres {
    max-height: 350px;
    margin-left: 0.5rem;
    overflow-y: auto;
  }

  .libellé,
  .fr-label.libellé {
    margin-left: 0;
    border-radius: 0.25rem;
  }

  .fr-label.libellé::before {
    display: none;
  }

  .ministère-sélectionné,
  .fr-checkbox-group input[type="checkbox"]:checked + .fr-label.libellé {
    font-weight: bold;
    color: var(--background-default-grey);
    background-color: var(--background-active-blue-france);
  }
`;

export default FiltresMinistèresStyled;
