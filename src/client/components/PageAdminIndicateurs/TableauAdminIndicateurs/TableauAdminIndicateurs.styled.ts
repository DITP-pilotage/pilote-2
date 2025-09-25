import styled from "@emotion/styled";

const TableauAdminIndicateursStyled = styled.section`
  .barre-de-recherche {
    width: 100%;
    max-width: 20.5rem;
  }

  .boutons-formulaire {
    display: flex;
    flex-direction: column;
    align-items: center;

    @media (min-width: 576px) {
      align-items: flex-start;
    }

    @media (min-width: 1050px) {
      flex-direction: row;
      align-items: center;
    }
  }

  .bouton-export {
    display: flex;
    justify-content: center;

    @media (min-width: 576px) {
      justify-content: flex-start;
    }

    @media (min-width: 1050px) {
      justify-content: flex-end;
    }
  }

  table.tableau {
    display: table;

    tbody > tr {
      cursor: pointer;

      &:hover:nth-of-type(even) {
        background-color: var(--background-contrast-grey-hover);
      }

      &:hover:nth-of-type(odd) {
        background-color: var(--background-alt-grey-hover);
      }

      td {
        max-width: 20px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }
  }

  nav {
    button {
      border-radius: 4px;
    }
  }
`;

export default TableauAdminIndicateursStyled;
