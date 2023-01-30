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
  width: ${(props) => largeurs[props.taille]};

  .jauge-fond {
    fill: #d9d9d9;
  }

  .jauge-valeur {
    fill: ${(props) => couleurs[props.couleur]};
  }
`;

export default JaugeDeProgressionStyled;
