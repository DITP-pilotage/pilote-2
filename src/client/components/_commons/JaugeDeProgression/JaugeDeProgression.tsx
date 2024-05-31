import { JaugeDeProgressionProps } from '@/components/_commons/JaugeDeProgression/JaugeDeProgression.interface';
import JaugeDeProgressionSVG from '@/components/_commons/JaugeDeProgression/JaugeDeProgressionSVG';
import JaugeDeProgressionStyled from './JaugeDeProgression.styled';

const classesÀPartirDeTaille = {
  sm: {
    valeur: 'jauge-valeur-dessous fr-h6',
    libellé: '',
  },
  md: {
    valeur: 'jauge-valeur-au-centre fr-h4 texte-centre',
    libellé: 'texte-centre',
  },
  lg: {
    valeur: 'jauge-valeur-au-centre fr-h1 texte-centre',
    libellé: 'texte-centre',
  },
};

export default function JaugeDeProgression({ couleur, libellé, pourcentage, taille, noWrap = false }: JaugeDeProgressionProps ) {
  return (
    <JaugeDeProgressionStyled>
      <div className={`jauge-tracé jauge-tracé--${taille}`}>
        <JaugeDeProgressionSVG
          couleur={couleur}
          pourcentage={pourcentage !== undefined ? pourcentage : null}
          taille={taille}
        />
        <p className={`jauge-valeur jauge-valeur--${couleur} texte-centre ${classesÀPartirDeTaille[taille].valeur}`}>
          { `${pourcentage?.toFixed(0) ?? '- '}%` }
        </p>
      </div>
      <p className={`fr-text--xs fr-mb-0 texte-centre ${classesÀPartirDeTaille[taille].libellé}${noWrap ? 'no-wrap' : ''}`}>
        {libellé}
      </p>
    </JaugeDeProgressionStyled>
  );
}
