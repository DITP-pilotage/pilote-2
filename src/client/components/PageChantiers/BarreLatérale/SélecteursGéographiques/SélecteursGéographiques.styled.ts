import styled from '@emotion/styled';

const SélecteursGéographiquesStyled = styled.div`
  background-color: var(--blue-france-850-200);
  width: 100%;

  .maille {
    background: var(--background-alt-blue-france);
    border-radius: 4px;
    width: fit-content;
    
    button {
      width: 8.4rem;
      border-radius: 4px;
      height: 3.1rem;

      &.séléctionné {
        background-color: var(--background-active-blue-france);
        color: var(--text-inverted-grey);
      }
    }
  }
`;

export default SélecteursGéographiquesStyled;
