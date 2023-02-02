import styled from '@emotion/styled';

const SélecteurMultipleStyled = styled.div`
  ul {
    padding: 0;
    list-style-type: none;
  }

  ul > li {
    padding-left: 1rem;
  }

  .choix-filtres {
    max-height: 350px;
    overflow-y: auto;
  }

  .fr-label.libellé {
    border-radius: 0.25rem;
  }

  .fr-label.libellé::before {
    display: none;
  }

  .fr-checkbox-group input[type="checkbox"]:checked + .fr-label.libellé {
    font-weight: bold;
    color: var(--background-default-grey);
    background-color: var(--background-active-blue-france);
  }
`;

export default SélecteurMultipleStyled;
