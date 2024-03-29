import styled from '@emotion/styled';

const TableauRéformesEnTêteStyled = styled.thead`
  background-color: var(--background-action-low-blue-france) !important;
  border: 1px solid var(--border-disabled-grey);

  th {
    &:first-of-type {
      border-radius: 8px 0 0;
    }

    &:last-child {
      border-radius: 0 8px 0 0;
    }
    
    p {
      display: inline-block;
    }
  }

  @media screen and (max-width: 78rem) {
    .title {
      font-size: .75rem !important;
    }
  }

`;

export default TableauRéformesEnTêteStyled;
