import styled from '@emotion/styled';

const PageFicheTerritorialeStyled = styled.div`
  .fiche-territoriale__avancement {
    height: 100%;
  }
  
  .fiche-territoriale__avancement--meteo {
    min-width: 3rem;
    display: flex;
    justify-content: center;
    align-items: center;
    
    img {
      height: 30px;
      width: 30px;
    }
  }
  
  .fiche-territoriale__contenu--meteo {
    img {
      height: 30px;
      width: 30px;
    }
  }
  
  .pourcentage {
    p {
      font-size: 2rem!important;
      padding-bottom: 1rem;
    }
    text-align: center;
  }
  
  .fiche-territoriale__avancement--barre-progression {
    width: 75%;
  }
  
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
    .fiche-territoriale--entete > div, .fiche-territoriale--contenu {
      font-size: 0.6rem !important;
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
