import styled from '@emotion/styled';

const HeaderFicheTerritorialeStyled = styled.div`
  display: none;

  @media print {
    display: block;
  }

  @page {
    size: auto;   /* auto is the initial value */
    margin: 1rem;  /* this affects the margin in the printer settings */
  }
`;

export default HeaderFicheTerritorialeStyled;
