import styled from '@emotion/styled';

const TableauChantiersTuileChantierStyled = styled.div`
  .tuile-chantier-entête {
    display: grid;
    grid-template-columns: auto max-content;
  }
  
  .tuile-chantier-corps {
    display: grid;
    grid-template-columns: 2.5rem auto 1.5rem 2.75rem;
    column-gap: 1rem;
    align-items: baseline;
    white-space: nowrap;
  
    .météo {
      display: flex;
      align-self: flex-start;
      
      .météo-picto {
        width: 28px;
        height: 28px;
      }
    }
    
    .avancement {
      flex-grow: 1;
      max-width: 12rem;
      height: 2rem;
    }
  }
`;

export default TableauChantiersTuileChantierStyled;
