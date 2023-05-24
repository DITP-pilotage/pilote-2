import styled from '@emotion/styled';

const TableauChantiersTuileMinistèreStyled = styled.div`
  display: grid;
  grid-template-columns: auto max-content;

  .tuile-chantier-entête .icônes {
    display: none;
  }
  
  .avancement {
    max-width: 15rem;
  }
`;

export default TableauChantiersTuileMinistèreStyled;
