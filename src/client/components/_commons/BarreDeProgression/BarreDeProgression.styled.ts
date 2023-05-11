import styled from '@emotion/styled';
import { BarreDeProgressionStyledProps } from './BarreDeProgression.interface';

const borderRadius = '0.375rem';

const couleurDeFond = {
  'bleu': 'var(--blue-ecume-850-200)',
  'blanc': '#ffffff',
  'grisMoyen': '#bababa',
  'grisClair': '#E5E5E5',
};

const couleurBordure = {
  'bleu': 'var(--blue-ecume-850-200)',
  'grisMoyen': '#bababa',
};

const couleurDeBarreEtTexte = {
  'primaire': 'var(--background-action-high-blue-france)',
  'secondaire': 'var(--grey-625-425)',
};

export const dimensions = {
  // eslint-disable-next-line sonarjs/no-duplicate-string
  xxs: { hauteur: '0.5rem', largeurTexte: '2.5rem', classNameDsfr: 'fr-text--xs' },
  xs: { hauteur: '0.625rem', largeurTexte: '2.5rem', classNameDsfr: 'fr-text--xs' },
  sm: { hauteur: '0.75rem', largeurTexte: '2.5rem', classNameDsfr: 'fr-text--xs' },
  md: { hauteur: '0.75rem', largeurTexte: '4rem', classNameDsfr: 'fr-text--sm' },
  lg: { hauteur: '2rem', largeurTexte: '6.5rem', classNameDsfr: 'fr-h1' },
};

const BarreDeProgressionStyled = styled.div<BarreDeProgressionStyledProps>`
  max-width: 100%;
  
  .barre {
    progress {
      display: block;
      width: 100%;
      height: ${props => dimensions[props.taille].hauteur};

      @media screen {
        background-color: ${props => couleurDeFond[props.fond]};
        border: ${props => props.bordure ? `1px solid ${couleurBordure[props.bordure]}` : 'none'};
        border-radius: ${borderRadius};
      }

      &::-webkit-progress-bar {
        background-color: ${props => couleurDeFond[props.fond]};
        border-radius: ${borderRadius};
      }

      &::-webkit-progress-value {
        border-radius: ${borderRadius};
      }

      &::-moz-progress-bar {
        border-radius: ${borderRadius};
      }

      &[value]::-moz-progress-bar {
        background-color: ${props => couleurDeBarreEtTexte[props.variante]};
      }

      &[value]::-webkit-progress-value {
        background-color: ${props => couleurDeBarreEtTexte[props.variante]};
      }

      &:not([value])::-moz-progress-bar {
        background-color: ${props => couleurDeFond[props.fond]};
      }
    }
  }
  
  .pourcentage {
    p {
      color: ${props => couleurDeBarreEtTexte[props.variante]}
    }
  }
  
  &.texte-côté {
    flex-direction: row;
    align-items: center;

    .barre {
      flex-grow: 1;
    }

    .pourcentage {
      p {
        width: ${props => dimensions[props.taille].largeurTexte};
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
