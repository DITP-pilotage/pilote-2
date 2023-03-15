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
    background-size: 100% 1px;
    background-position: bottom;
    background-repeat: no-repeat;
    background-image: linear-gradient(0deg, var(--border-default-grey), var(--border-default-grey));
  }
`;

export default TableauStyled;
