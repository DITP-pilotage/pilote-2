import styled from '@emotion/styled';

const TableauStyled = styled.div`
  overflow-x: auto;

  table.tableau {
    display: table;

    thead {
      background-color: var(--background-action-low-blue-france);
      border: 1px solid var(--border-disabled-grey);

      th:first-of-type {
        border-radius: 8px 0 0;
      }

      th:last-child {
        border-radius: 0 8px 0 0;
      }
    }
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
