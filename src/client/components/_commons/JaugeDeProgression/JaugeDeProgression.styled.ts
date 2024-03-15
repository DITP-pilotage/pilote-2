import styled from '@emotion/styled';
import { JaugeDeProgressionStyledProps } from './JaugeDeProgression.interface';

const couleurs = {
  bleu: 'var(--background-active-blue-france)',
  bleuClair: 'var(--background-flat-info)', 
  violet: '#8585F6',
  orange: '#FC5D00',
  vert: '#27A658',
  rose: 'var(--background-action-high-pink-tuile)',
};

const largeurs = {
  sm: {
    'max': '3.75rem',
    'min': '3.75rem',
  },
  md: {
    'max': '5.5rem',
    'min': '4rem',
  },
  lg: {
    'max': '10.5rem',
    'min': '8.25rem',
  },
};

const JaugeDeProgressionStyled = styled.div<JaugeDeProgressionStyledProps>`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;

  .jauge-tracé {
    position: relative;
    width: ${(props) => largeurs[props.taille].max};
    
    .jauge-valeur {
      margin-bottom: 0;
      color: ${(props) => couleurs[props.couleur]};
      word-break: normal;

      &.jauge-valeur-au-centre {
        position: absolute;
        top: calc(50% - 1.4rem);
        width: 100%;
        line-height: 2.5rem !important;
      }
    }

    .jauge-barre-fond {
      fill: #d9d9d9;
    }

    .jauge-barre-valeur {
      fill: ${(props) => couleurs[props.couleur]};
    }
  }

  @media screen and (max-width: 80rem) {
    .jauge-tracé {
      width: ${(props) => largeurs[props.taille].min};
    }
  }
`;

export default JaugeDeProgressionStyled;
