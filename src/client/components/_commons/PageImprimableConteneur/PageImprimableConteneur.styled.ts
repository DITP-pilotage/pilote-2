import styled from '@emotion/styled';

const PageImprimableConteneurStyled = styled.table`
  width: 100%;

  & > thead,
  & > tfoot {
    display: none;
  }

  @media print {
    & > thead {
      display:table-header-group;
    }
    & > tfoot {
      display:table-footer-group;
    }
  }
`;

export default PageImprimableConteneurStyled;
