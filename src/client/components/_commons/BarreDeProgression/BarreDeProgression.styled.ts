import styled from '@emotion/styled';


const BarreDeProgressionStyled = styled.div`
  max-width: 100%;
  
  .barre {
    progress {
      display: block;
      width: 100%;
      border-radius: 0.375rem;
      
      &.progress--xxs {
        height: 0.5rem;
      }
      
      &.progress--xs {
        height: 0.625rem;
      }
      
      &.progress--sm {
        height: 0.75rem;
      }
      
      &.progress--md {
        height: 0.75rem;
      }
      
      &.progress--lg {
        height: 2rem;
      }
      
      &.progress--bleu {
        background-color: var(--blue-ecume-850-200);
        
        &::-webkit-progress-bar {
            background-color: var(--blue-ecume-850-200);
        }
      }
      
      &.progress--blanc {
        background-color: #fff;
        
        &::-webkit-progress-bar {
            background-color: #fff;
        }
      }
      
      &.progress--gris-moyen {
        background-color: #bababa;
        
        &::-webkit-progress-bar {
            background-color: #bababa;
        }
      }
      
      &.progress--gris-clair {
        background-color: #E5E5E5;
        
        &::-webkit-progress-bar {
            background-color: #E5E5E5;
        }
      }
      
      &.progress--border-bleu {
        border: 1px solid var(--blue-ecume-850-200)
      }
      
      &.progress--border-gris-moyen {
        border: 1px solid #bababa
      }
      
      &::-webkit-progress-bar {
        border-radius: 0.375rem;
      }

      &::-webkit-progress-value {
        border-radius: 0.375rem;
      }

      &::-moz-progress-bar {
        border-radius: 0.375rem;
      }

      &.progress--primaire {
        &::-moz-progress-bar {
          background-color: var(--background-action-high-blue-france);
        } 
        
        &::-webkit-progress-value {
          background-color: var(--background-action-high-blue-france);
        }
      }

      &.progress--secondaire {
        &::-moz-progress-bar {
          background-color: var(--grey-625-425);
        }
        
        &::-webkit-progress-value {
          background-color: var(--grey-625-425);
        }
      }

      &.progress--rose {
        &::-moz-progress-bar {
            background-color: var(--background-action-high-pink-tuile);
        }
        
        &::-webkit-progress-value {
            background-color: var(--background-action-high-pink-tuile);
        }
      }
    }
  }
  
  .pourcentage {
    &.pourcentage--bleu {
      color: var(--blue-ecume-850-200);
    }

    &.pourcentage--blanc {
      color: #fff;
    }

    &.pourcentage--gris-moyen {
      color: #bababa;
    }

    &.pourcentage--gris-clair {
      color: #E5E5E5;
    }
  }
  
  &.texte-côté {
    flex-direction: row;
    align-items: center;

    .barre {
      flex-grow: 1;
    }

    .pourcentage {
      &.pourcentage--xxs {
        width: 2.5rem;                
      }
      
      &.pourcentage--xs {
        width: 2.5rem;                
      }
      
      &.pourcentage--sm {
        width: 2.5rem;                
      }
      
      &.pourcentage--md {
        width: 2.5rem;                
      }
      
      &.pourcentage--lg {
        width: 6.5rem;                
      }
      
      p {
        padding-left: 0.5em;
        text-align: right;
        white-space: nowrap;
        vertical-align: middle;
      }
    }
  }
  
  &.texte-dessus {
    flex-direction: column-reverse;
  }
`;

export default BarreDeProgressionStyled;
