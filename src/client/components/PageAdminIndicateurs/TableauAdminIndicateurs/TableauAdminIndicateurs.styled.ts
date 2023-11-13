import styled from '@emotion/styled';

const TableauAdminIndicateursStyled = styled.section`

  .barre-de-recherche {
    width: 100%;
    max-width: 20.5rem;
  }

  .titre-tableau{
    color: var(--text-title-blue-france);
  }
  
  .fr-icon-red {
    color: red;
  }
  
  .fr-icon-green {
    color: green;
  }

  table.tableau {
    display: table;
    width: 100%;
    
    tbody > tr {
      cursor: pointer;
      
      &:hover:nth-of-type(even) {
        background-color: var(--background-contrast-grey-hover);
      }

      &:hover:nth-of-type(odd) {
        background-color: var(--background-alt-grey-hover);
      }

      td {
        max-width: 20rem;
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
