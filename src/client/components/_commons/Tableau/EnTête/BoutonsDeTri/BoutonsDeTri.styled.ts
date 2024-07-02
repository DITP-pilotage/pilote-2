import styled from '@emotion/styled';

const BoutonsDeTriStyled = styled.div`
  display: flex;
  flex-direction: row;

  .bouton-de-tri {
    width: 1.5rem;
    background-color: var(--background-action-low-blue-france);
    border: 1px solid var(--background-default-grey);
    border-radius: 4px;

    &:hover {
      background-color: var(--background-action-low-blue-france-hover);
    }

    &.actif {
      background-color: var(--background-active-blue-france);
      
      &:hover {
        background-color: var(--background-active-blue-france-hover);
      }
    }
  }
`;

export default BoutonsDeTriStyled;
