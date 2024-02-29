import styled from '@emotion/styled';

const PageFicheTerritorialeStyled = styled.div`
  .fiche-territoriale__avancement {
    height: 100%;
  }
  
  .fiche-territoriale__container {
    padding-top: 1rem;
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
      line-height: 1rem;
    }  
    
    .fiche-territoriale--contenu--row:not(:first-of-type) {
      border-top: 1px solid var(--grey-975-75);    
    }
  }
  
  
  @media print {
    .fiche-territoriale__container {
      padding-top: 0;
    }
    
    .fr-logo {
      font-size: 0.8rem;
      
      &::after {
        background-position: 0 calc(100% + 0.875rem)!important;
        background-size: 4.25rem 2.75rem;
      }
      
      &::before {
        margin-bottom: 0;
        background-position: 0 -0.0469rem,0 0,0 0;
        background-size: 2.0625rem 0.8438rem,2.0625rem 0.75rem,0;
      }
    }
    
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
    margin: 0.5cm 0 1.5cm;
  }
`;

export default PageFicheTerritorialeStyled;
