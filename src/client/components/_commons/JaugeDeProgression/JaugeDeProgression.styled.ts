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
  sm: '3.75rem',
  lg: '10.5rem',
};

const JaugeDeProgressionStyled = styled.div<JaugeDeProgressionStyledProps>`
  position: relative;
  width: ${(props) => largeurs[props.taille]};

  .jauge-tracé {
    position: relative;

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
`;

export default JaugeDeProgressionStyled;
