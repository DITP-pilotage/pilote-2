import styled from '@emotion/styled';

const TableauAdminUtilisateursStyled = styled.section`

  .fr-tag {
    min-width: auto;
  }
    
  .fr-tag-active {
    color: white;
    background-color: var(--blue-france-sun-113-625);
  }
  
  .fr-tag-active:hover {
    color: white;
    cursor: not-allowed;
    background-color: var(--blue-france-sun-113-625);
  }
    
  .barre-de-recherche {
    width: 100%;
    max-width: 20.5rem;
  }

  .titre-tableau{
    color: var(--text-title-blue-france);
  }

  table.tableau {
    display: table;
    
    tbody > tr{
      cursor: pointer;
      
      &:hover:nth-of-type(even) {
        background-color: var(--background-contrast-grey-hover);
      }

      &:hover:nth-of-type(odd) {
        background-color: var(--background-alt-grey-hover);
      }

      td{
        max-width: 10px;
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

export default TableauAdminUtilisateursStyled;
