import styled from '@emotion/styled';

const PageImportIndicateurExplicationEtapeImportStyled = styled.section`
  background-color: var(--background-alt-grey);

  h2 {
    color: var(--background-action-high-blue-france);
  }

  li::marker {
    content: '';
  }

  @media(min-width: 62rem) {
    li:first-of-type {
      padding-left: 0;
    }

    li:last-of-type {
      padding-right: 0;
    }
  }
`;

export default PageImportIndicateurExplicationEtapeImportStyled;
