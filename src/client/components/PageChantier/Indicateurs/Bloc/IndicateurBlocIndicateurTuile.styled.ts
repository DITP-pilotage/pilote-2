import styled from '@emotion/styled';

const IndicateurBlocIndicateurTuile = styled.div`
  table {
    display: table;
    overflow: hidden;
    background-color: var(--grey-1000-50);
  }
  
  thead {
    background-color: var(--background-action-low-blue-france);
    background-image: unset;

    th {
      &:first-of-type {
        border-radius: 8px 0 0;
      }

      &:last-child {
        border-radius: 0 8px 0 0;
      }
    }
  }

  tbody {
    tr {
      background-color: unset !important;

      td {
        line-height: 1.25rem;
      }

      td.libellés {
        width: 9rem;
        font-weight: bold;
      }
    }
  }
`;

export default IndicateurBlocIndicateurTuile;