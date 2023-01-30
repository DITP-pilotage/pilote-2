import styled from '@emotion/styled';
import {
  JaugeDeProgressionCouleur,
  JaugeDeProgressionTaille,
} from '@/components/_commons/JaugeDeProgression/JaugeDeProgression.interface';

interface JaugeDeProgressionStyledProps {
  taille: JaugeDeProgressionTaille,
  couleur: JaugeDeProgressionCouleur,
}

const couleurs = {
  bleu: 'var(--background-active-blue-france)',
  violet: '#8585F6',
  orange: '#FC5D00',
  vert: '#27A658',
};

const largeurs = {
  petite: '3.75rem',
  grande: '10.5rem',
};

const JaugeDeProgressionStyled = styled.div<JaugeDeProgressionStyledProps>`
  position: relative;
  width: ${(props) => largeurs[props.taille]};

  .jauge-valeur-centré,
  .jauge-valeur-dessous {
    margin-bottom: 0;
    color: ${(props) => couleurs[props.couleur]};
  }

  .jauge-valeur-centré {
    position: absolute;
    top: calc(50% - 1rem);
    width: 100%;
    margin: 0;
    line-height: 0.5rem !important;
    text-align: center;
  }

  .jauge-libellé-centré {
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
