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
      size: 280mm 396mm;
    }

    .grid-template {
      grid-template-columns: 1fr 1fr;
    }
    
    .rubrique {
      display: block;
      break-inside: avoid;
    }
    
    main {
      background: #FFF !important;
    }

    .barre-latérale, .fr-btn, .fr-link, .fr-accordion {
      display: none;
    }
  }
`;

export default PageProjetStructurantStyled;
