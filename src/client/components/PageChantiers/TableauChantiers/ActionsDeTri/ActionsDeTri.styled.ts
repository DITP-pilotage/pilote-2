import styled from '@emotion/styled';

const ActionsDeTriStyled = styled.div`
  display: flex;
  align-items: end;
  width: 100%;
  max-width: 22rem;

  .sélecteur-colonne-à-trier {
    flex-grow: 1;

    select {
      background-color: var(--background-alt-blue-france);
    }
  }
`;

export default ActionsDeTriStyled;
