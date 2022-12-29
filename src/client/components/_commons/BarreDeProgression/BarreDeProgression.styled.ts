import styled from '@emotion/styled';
import { BarreDeProgressionVariante, BarreDeProgressionFond, BarreDeProgressionTaille } from './BarreDeProgression.interface';

type BarreDeProgressionStyledProps = {
  variante: BarreDeProgressionVariante
  fond: BarreDeProgressionFond,
  taille: BarreDeProgressionTaille,
};

const borderRadius = '0.375rem';

const couleurDeFond = {
  'bleu': 'var(--blue-ecume-850-200)',
  'gris': 'var(--background-contrast-grey)',
  'blanc': '#fff',
};

const couleurDeBarre = {
  'primaire': 'var(--background-action-high-blue-france)',
  'secondaire': '#5f5ff1' /* TODO variable ? */,
};

export const dimensions = {
  petite: { hauteur: '0.5rem', largeurTexte: '3.25rem', classNameDsfr: 'fr-text--xs' },
  moyenne: { hauteur: '0.75rem', largeurTexte: '4rem', classNameDsfr: 'fr-h4' },
  grande: { hauteur: '2rem', largeurTexte: '6.5rem', classNameDsfr: 'fr-h1' },
};

const grandientBarreSecondaire = `
  linear-gradient(
    -45deg,
    #000 5%,
    ${couleurDeBarre.secondaire} 5%,
    ${couleurDeBarre.secondaire} 45%,
    #000 45%,
    #000 55%,
    ${couleurDeBarre.secondaire} 55%,
    ${couleurDeBarre.secondaire} 95%,
    #000 95%
  )
`;

const BarreDeProgressionStyled = styled.div<BarreDeProgressionStyledProps>`
  max-width: 100%;

  .barre {
    flex-grow: 1;

    progress {
      display: block;
      width: 100%;
      height: ${props => dimensions[props.taille].hauteur};
      background-color: ${props => couleurDeFond[props.fond]};
      border: 0;
      border-radius: ${borderRadius};

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
        background-color: ${props => props.variante === 'secondaire' ? null : couleurDeBarre[props.variante]};
        background-image: ${props => props.variante === 'secondaire' ? grandientBarreSecondaire : null};
        background-size: ${props => props.variante === 'secondaire' ? '8px 8px' : null};
      }

      &[value]::-webkit-progress-value {
        background-color: ${props => props.variante === 'secondaire' ? null : couleurDeBarre[props.variante]};
        background-image: ${props => props.variante === 'secondaire' ? grandientBarreSecondaire : null};
        background-size: ${props => props.variante === 'secondaire' ? '8px 8px' : null};
      }

      &:not([value])::-moz-progress-bar {
        background-color: ${props => couleurDeFond[props.fond]};
      }
    }

    .conteneur-curseurs {
      height: 0;
    }
  }

  .pourcentage {
    flex-grow: 0;
    flex-shrink: 0;

    p {
      width: ${props => dimensions[props.taille].largeurTexte};
      padding-left: 0.5em;
      color: ${props => couleurDeBarre[props.variante]};
      text-align: right;
      white-space: nowrap;
      vertical-align: middle;
    }
  }
`;

export default BarreDeProgressionStyled;
