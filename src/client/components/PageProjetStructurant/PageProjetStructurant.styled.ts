import styled from '@emotion/styled';

const PageProjetStructurantStyled = styled.div`
  background: var(--background-contrast-grey);

  .rubrique {
    display: flex;
    flex-direction: column;
  }

  h2 {
    color: var(--text-title-blue-france);
  }

  tbody {
    background: none;
  }

  .grid-template {
    display: grid;
    gap: 1.5rem;
  }

  @media (min-width: 48rem) {
    .grid-template {
      grid-template-columns: 1fr 1fr;
    }
  }

  @media print {
    @page {
      margin: 12mm 0;
      size: 280mm 396mm;
    }
    
    background: #fff;

    main {
      padding-right: 12mm;
      padding-left: 12mm;
    }

    .grid-template {
      grid-template-columns: 1fr 1fr;
    }
    
    .rubrique {
      display: grid;
      grid-template-rows: auto 1fr;
      break-inside: avoid;
    }

    .fr-accordion {
      display: none;
    }
  }
`;

export default PageProjetStructurantStyled;
