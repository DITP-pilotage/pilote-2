import styled from '@emotion/styled';

const ListeChantiersTableauEnTêteStyled = styled.thead`
    background-color: var(--background-action-low-blue-france) !important;
    border: 1px solid var(--border-disabled-grey);

    th {
      &:first-of-type {
        border-radius: 8px 0 0;
      }

      &:last-child {
        border-radius: 0 8px 0 0;
      }
    }

    .actif {
      background: var(--background-active-blue-france);
    }

    .flèche-de-tri {
      border: 1px solid var(--background-default-grey);
      border-radius: 4px;
    }
`;

export default ListeChantiersTableauEnTêteStyled;
