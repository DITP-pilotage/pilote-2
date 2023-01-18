import styled from '@emotion/styled';

const SélecteursGéographiquesStyled = styled.div`
  width: 100%;
  background-color: var(--blue-france-850-200);

  .maille {
    width: fit-content;
    background: var(--background-alt-blue-france);
    border-radius: 4px;

    button {
      width: 8.4rem;
      height: 3.1rem;
      border-radius: 4px;

      &.séléctionné {
        color: var(--text-inverted-grey);
        background-color: var(--background-active-blue-france);
      }
    }
  }
`;

export default SélecteursGéographiquesStyled;
