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

  @media print {
    @page {
      size: 280mm 396mm;
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
