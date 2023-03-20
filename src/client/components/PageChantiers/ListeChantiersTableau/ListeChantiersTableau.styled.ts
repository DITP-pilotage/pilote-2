import styled from '@emotion/styled';

const ListeChantiersTableauStyled = styled.section`
  display: grid;  overflow-x: auto;
  color: var(--text-action-high-grey);
  
  .tableau-actions {
    display: flex;
    align-items: center;

    div {
      max-width: 100%;
    }
  }

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
        }
      }

      .ligne-chantier {
        cursor: pointer;
        
        &:hover:nth-of-type(even) {
          background-color: var(--background-contrast-grey-hover);
        }
        
        &:hover:nth-of-type(odd) {
          background-color: var(--background-alt-grey-hover);
        }
      }
      
      .ligne-ministère,
      .ligne-ministère:nth-of-type(2n) {
        cursor: pointer;
        background-color: var(--background-default-grey);
        background-image: linear-gradient(0deg, var(--border-default-grey), var(--border-default-grey));
        background-repeat: no-repeat;
        background-position: bottom;
        background-size: 100% 1px;

        &:hover {
          background-color: var(--background-default-grey-hover);
        }
      }
    }
  }

  nav {
    button {
      border-radius: 4px;
    }
  }

  .icone {
      color: var(--blue-france-sun-113-625)
    }
`;

export default ListeChantiersTableauStyled;
