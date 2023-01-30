import {
  JaugeDeProgressionProps,
} from '@/components/_commons/JaugeDeProgression/JaugeDeProgression.interface';
import JaugeDeProgressionSVG from '@/components/_commons/JaugeDeProgression/JaugeDeProgressionSVG';
import JaugeDeProgressionStyled from './JaugeDeProgression.styled';

const classesLibellé = {
  petite: 'jauge-valeur-dessous fr-h4',
  grande: 'jauge-valeur-centré fr-display--xs',
};

export default function JaugeDeProgression({ pourcentage, couleur, taille }: JaugeDeProgressionProps ) {
  return (
    <JaugeDeProgressionStyled
      couleur={couleur}
      taille={taille}
    >
      <JaugeDeProgressionSVG
        pourcentage={pourcentage}
        taille={taille}
      />
      <p className={classesLibellé[taille]}>
        { `${pourcentage.toFixed(0)}%` }
      </p>
    </JaugeDeProgressionStyled>
  );
}
