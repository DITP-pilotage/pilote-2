import styled from '@emotion/styled';

const TableauStyled = styled.section`
  overflow-x: auto;

  table.tableau {
    display: table;
  }

  .tableau-actions {
    display: flex;
    align-items: center;

    div {
      max-width: 100%;
    }
  }

  nav {
    button {
      border-radius: 4px;
    }
  }

  tbody .ligne-groupée,
  tbody .ligne-groupée:nth-of-type(2n) {
    background-color: white;
  }

  tbody .ligne-non-groupée td {
    background-color: var(--grey-975-75) !important;
  }

  tbody .ligne-non-groupée:nth-of-type(2n) td {
    background-color: var(--grey-950-100) !important;
  }
`;

export default TableauStyled;
