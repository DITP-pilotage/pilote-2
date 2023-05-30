import styled from '@emotion/styled';

const TableauAdminUtilisateursStyled = styled.section`

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
    }
  }

  nav {
    button {
      border-radius: 4px;
    }
  }
`;

export default TableauAdminUtilisateursStyled;
