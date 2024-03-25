import styled from '@emotion/styled';

const PageFicheConducteurStyled = styled.div`
  .fiche-conducteur__bloc {
    > div {
      height: 100%;
    }
  }

  .fiche-conducteur__container {
    .encart-container {
      padding: 0.5rem;
    }
  }
  
  .grid-row--header {
    border-top-left-radius: 6px;
    border-top-right-radius: 6px;
  }
  
  .only-print {
    display: none;
  }
  
  @media print {
    .fr-badge, .fr-text--xs {
      font-size: .625rem!important;
      line-height: 1rem !important;
    }
    
    .fr-text--sm {
      font-size: .625rem!important;
      line-height: 1rem !important;
    }
    
    .fiche-conducteur__bloc--no-border {
      .bloc-container {
        border: none;
      }
    }
    
    .fiche-conducteur__bloc--border-light {
      .bloc-container {
        padding: 0;
        border-color: var(--border-disabled-grey);
      }
    }

    .only-print {
      display: block;
    }
  }
  
  
  @page {
    margin: 0;
    size: landscape!important;
  }
`;

export default PageFicheConducteurStyled;
