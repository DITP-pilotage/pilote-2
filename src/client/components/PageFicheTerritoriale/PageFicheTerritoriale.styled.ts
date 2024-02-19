import styled from '@emotion/styled';

const PageFicheTerritorialeStyled = styled.div`
  .fiche-territoriale--tableau {
    div.fr-grid-row:first-of-type {
      border-top-left-radius: 8px;
      border-top-right-radius: 8px;
      border-bottom: 2px solid black;    
    }
    
    img.météo-picto {
      width: 28px;
      height: 28px;
    }
    .fiche-territoriale--contenu--xs {
      font-size: 0.6rem !important;
    }
  }
  
  
  @media print {
    .indicateur-fiche-territoriale--entete span {
      max-height: 1rem;
    }
    .indicateur-fiche-territoriale--entete {
      padding: 0!important;
      margin: 0!important;
    }
    .chantier-fiche-territoriale--contenu {
      padding-top: 0!important;
      padding-bottom: 0!important;
    }
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
    .fr-text--xs {
      font-size: 0.5rem !important;
      line-height: 1.2rem !important;
    }
    .fiche-territoriale--tableau {
      .fiche-territoriale--contenu--xs {
        font-size: 0.4rem !important;
      }
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
