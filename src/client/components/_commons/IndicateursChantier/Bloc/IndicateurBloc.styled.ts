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
    background-color: var(--background-contrast-info)!important;
    
    & .texte-proposition {
      color: var(--text-default-info)!important;
      
      & .indicateur-valeur, & .pourcentage {
        color: var(--text-default-info)!important;
      }
    }
  }
  
  .indicateur-date-valeur {
    height: 1rem;
    font-size: 0.625rem;
    line-height: 1rem;
  }
`;

export default IndicateurBlocStyled;
