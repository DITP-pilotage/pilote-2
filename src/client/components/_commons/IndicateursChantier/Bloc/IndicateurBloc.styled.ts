import styled from '@emotion/styled';

const IndicateurBlocStyled = styled.div`
  &:last-of-type {
    margin-bottom: 0 !important;
  }
  
  td {
    min-height: 2rem;
    vertical-align: top;
  }

  .indicateur-valeur,
  .indicateur-date-valeur {
    font-size: inherit;
  }
  
  .ligne-creation-proposition-valeur-actuelle {
    background-color: transparent!important;
  }
  
  tr.ligne-modification-proposition-valeur-actuelle {
    background-color: var(--yellow-moutarde-975-75)!important;
    
    
    & .infobulle-bouton {
      color: var(--yellow-moutarde-main-679)!important;
    }
    
    & .bouton-proposition-valeur-actuelle {
      color: var(--yellow-moutarde-main-679)!important;
      box-shadow: inset 0 0 0 1px var(--yellow-moutarde-main-679)!important;
    }

    & .texte-proposition {
      color: var(--yellow-moutarde-main-679)!important;
      
      & .indicateur-valeur, & .pourcentage {
        color: var(--yellow-moutarde-main-679)!important;
      }
    }
  }
  
  .fr-text-warning .infobulle-date-previsionnelle {
    color: var(--border-plain-warning)!important;
  }
  
  .texte-gris .infobulle-date-previsionnelle {
    color: var(--text-mention-grey)!important;
  }
  
  .infobulle-date-previsionnelle {
    position: relative;
    min-height: 0;
    padding: 0;
    
    button::before {
      --icon-size: 1.3rem!important;
    }
  }
  
  .indicateur-date-valeur {
    height: 1rem;
    font-size: 0.625rem;
    line-height: 1rem;
  }
`;

export default IndicateurBlocStyled;
