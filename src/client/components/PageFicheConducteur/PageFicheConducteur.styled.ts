import styled from '@emotion/styled';

const PageFicheConducteurStyled = styled.div`
  .fiche-conducteur__bloc {
    > div {
      height: 100%;
    }
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

    .only-print {
      display: block;
    }
  }
  
  
  @page {
    margin: 0.5cm 0 1.5cm;
    size: landscape!important;
  }
`;

export default PageFicheConducteurStyled;
