import styled from '@emotion/styled';

const TableauChantiersTuileChantierStyled = styled.div`
  .tuile-chantier-entête {
    display: grid;
    grid-template-columns: auto auto;
  }
  
  .tuile-chantier-corps {
    display: grid;
    grid-template-columns: 2.1rem auto;
    column-gap: 1rem;
    align-items: center;
  
    .météo {
      display: flex;
      align-items: center;
      
      .météo-picto {
        max-width: 100%;
      }
    }
    
    .avancement {
      flex-grow: 1;
      max-width: 12rem;
    }
  }
`;

export default TableauChantiersTuileChantierStyled;
