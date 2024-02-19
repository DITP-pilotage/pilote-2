import styled from '@emotion/styled';

const PageFicheTerritorialeStyled = styled.div`
  .fiche-territoriale--tableau {
    div.fr-grid-row:first-child {
      border-top-left-radius: 8px;
      border-top-right-radius: 8px;
      border-bottom: 2px solid black;    
    }
    
    img.météo-picto {
      width: 28px;
      height: 28px;
    }
  }
  
  
  @media print {
    .fiche-territoriale--entete > div, .fiche-territoriale--contenu {
      font-size: 0.6rem !important;
    }
    .fr-text--xl {
      font-size: 0.8rem !important;
    }
    .fr-text--lg {
      font-size: 0.9rem !important;
    }
    .fr-text--sm {
      font-size: 0.6rem !important;
    }
    
    div.fr-grid-row {
      font-size: 0.7rem !important;
    }
  }
  
  @page {
    size: auto;   /* auto is the initial value */
    margin: 1rem;  /* this affects the margin in the printer settings */
  }
`;

export default PageFicheTerritorialeStyled;
