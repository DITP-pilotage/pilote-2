import styled from '@emotion/styled';

const PageFicheTerritorialeStyled = styled.div`
  .fiche-territoriale__avancement {
    height: 100%;
  }
  
  .fiche-territoriale__avancement--meteo {
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 3rem;
    
    img {
      width: 30px;
      height: 30px;
    }
  }
  
  .fiche-territoriale__contenu--meteo {
    img {
      width: 30px;
      height: 30px;
    }
  }
  
  .pourcentage {
    text-align: center;
    
    p {
      padding-bottom: 1rem;
      font-size: 2rem!important;
    }
  }
  
  .fiche-territoriale__avancement--barre-progression {
    width: 75%;
  }
  
  .fiche-territoriale--tableau {
    div.fr-grid-row:first-of-type {
      border-bottom: 2px solid black;    
      border-top-left-radius: 8px;
      border-top-right-radius: 8px;
    }
    
    img.météo-picto {
      width: 28px;
      height: 28px;
    }
    
    .fiche-territoriale--contenu--xs {
      font-size: 0.8rem !important;
      white-space: nowrap;
    }  
    
    .fiche-territoriale--contenu--row:not(:first-of-type) {
      border-top: 1px solid var(--grey-975-75);    
    }
  }
  
  
  @media print {
    .fiche-territoriale__meteo {
      > div {
        height: 100%;
      }
    }
    
    .indicateur-fiche-territoriale--entete span {
      max-height: 1rem;
    }
    
    .indicateur-fiche-territoriale--entete {
      padding-top: 0!important;
      padding-bottom: 0!important;
      margin: 0!important;
    }
    
    .chantier-fiche-territoriale--contenu {
      padding-top: 0!important;
      padding-bottom: 0!important;
    }
    
    .fiche-territoriale--entete {
      padding-top: 0.5rem!important;
      padding-bottom: 0.5rem!important;
      
      > div, .fiche-territoriale--contenu {
        font-size: 0.6rem !important;
      }
    }
    
    .fr-text--xl {
      font-size: 0.8rem !important;
    }
    
    .fr-text--lg {
      font-size: 0.9rem !important;
    }
    
    .fr-text--md {
      font-size: 0.8rem !important;
      line-height: 1.1rem !important;
    }
    
    .fr-text--sm {
      font-size: 0.6rem !important;
      line-height: 1rem !important;
    }
    
    .fr-text--xs {
      font-size: 0.6rem !important;
      line-height: 1rem !important;
    }
    
    .fiche-territoriale--tableau {
      .fiche-territoriale--contenu--xs {
        font-size: 0.6rem !important;
      }
    }
    
    div.fr-grid-row {
      font-size: 0.7rem !important;
    }
    
    .bloc__contenu {
      padding-top: 0.5rem!important;
    }
  }
  
  @page {
    margin: 1.5cm 0;
  }
`;

export default PageFicheTerritorialeStyled;
