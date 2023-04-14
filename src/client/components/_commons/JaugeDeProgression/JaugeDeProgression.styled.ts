import styled from '@emotion/styled';
import { JaugeDeProgressionStyledProps } from './JaugeDeProgression.interface';

const couleurs = {
  bleu: 'var(--background-active-blue-france)',
  bleuClair: 'var(--background-flat-info)', 
  violet: '#8585F6',
  orange: '#FC5D00',
  vert: '#27A658',
};

const largeurs = {
  sm: '3.75rem',
  lg: '10.5rem',
};

const JaugeDeProgressionStyled = styled.div<JaugeDeProgressionStyledProps>`
  position: relative;
  width: ${(props) => largeurs[props.taille]};

  .jauge-valeur-au-centre,
  .jauge-valeur-dessous {
    margin-bottom: 0;
    color: ${(props) => couleurs[props.couleur]};
    word-break: normal;
  }

  .jauge-valeur-au-centre {
    position: absolute;
    top: calc(50% - 1rem);
    width: 100%;
    margin: 0;
    line-height: 0.5rem !important;
    text-align: center;
  }

  .jauge-libellé-au-centre {
    text-align: center;
  }

  .jauge-barre-fond {
    fill: #d9d9d9;
  }

  .jauge-barre-valeur {
    fill: ${(props) => couleurs[props.couleur]};
  }
`;

export default JaugeDeProgressionStyled;
