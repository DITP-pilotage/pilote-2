import styled from '@emotion/styled';

const TableauStyled = styled.div`
  overflow-x: auto;

  table.tableau {
    display: table;
  }

  .barre-de-recherche {
    display: flex;
    justify-content: space-between;

    div {
      max-width: 100%;
    }
  }
`;

export default TableauStyled;
