import styled from '@emotion/styled';

const TableauStyled = styled.div`
  overflow-x: auto;

  table.tableau {
    display: table;

    tr:hover {
      box-shadow: var(--overlap-shadow);
    }
  }

  .barre-de-recherche {
    display: flex;
    justify-content: space-between;

    div {
      max-width: 100%;
    }
  }

  nav {
    button {
      border-radius: 4px;
    }
  }
`;

export default TableauStyled;
