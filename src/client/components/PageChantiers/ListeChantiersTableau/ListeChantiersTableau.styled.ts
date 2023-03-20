import styled from '@emotion/styled';

const ListeChantiersTableauStyled = styled.section`
  overflow-x: auto;
  display: grid;
  color: var(--text-action-high-grey);

  table.tableau {
    display: table;
    th {
      &:nth-of-type(3) {
        width: 11rem;
        min-width: 11rem;
      }

      &:nth-of-type(4) {
        width: 15rem;
        min-width: 15rem;
      }

      &:last-of-type {
        width: 4rem;
      }
    }

    tbody {
      tr {
        height: 4.7rem;

        a {
          text-decoration: none;
          background: none;

          &:hover {
            color: var(--text-action-high-blue-france);
          }
        }
      }
    }
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

  .icone {
      color: var(--blue-france-sun-113-625)
    }
`;

export default ListeChantiersTableauStyled;
