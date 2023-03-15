import styled from '@emotion/styled';

const ListeChantiersTableauStyled = styled.section`
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
    background-image: linear-gradient(0deg, var(--border-default-grey), var(--border-default-grey));
    background-repeat: no-repeat;
    background-position: bottom;
    background-size: 100% 1px;
  }
`;

export default ListeChantiersTableauStyled;
