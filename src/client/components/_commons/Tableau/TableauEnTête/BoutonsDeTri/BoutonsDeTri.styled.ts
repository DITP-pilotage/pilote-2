import styled from '@emotion/styled';

const BoutonsDeTriStyled = styled.div`
  display: inline-block;

  .bouton-de-tri.actif {
    background-color: var(--background-active-blue-france);
  }

  .bouton-de-tri.actif:hover {
    background-color: var(--background-active-blue-france-hover);
  }

  .bouton-de-tri {
    background-color: var(--background-action-low-blue-france);
    border: 1px solid var(--background-default-grey);
    width: 1.5rem;
    border-radius: 4px;
  }
  
  .bouton-de-tri:hover {
    background-color: var(--background-action-low-blue-france-hover);
  }
`;

export default BoutonsDeTriStyled;
