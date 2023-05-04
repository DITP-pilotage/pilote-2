import { JaugeDeProgressionProps } from '@/components/_commons/JaugeDeProgression/JaugeDeProgression.interface';
import JaugeDeProgressionSVG from '@/components/_commons/JaugeDeProgression/JaugeDeProgressionSVG';
import JaugeDeProgressionStyled from './JaugeDeProgression.styled';

const classesÀPartirDeTaille = {
  sm: {
    valeur: 'jauge-valeur-dessous fr-h6',
    libellé: '',
  },
  lg: {
    valeur: 'jauge-valeur-au-centre fr-h1 texte-centre',
    libellé: 'texte-centre',
  },
};

export default function JaugeDeProgression({ couleur, libellé, pourcentage, taille }: JaugeDeProgressionProps ) {
  return (
    <JaugeDeProgressionStyled
      couleur={couleur}
      taille={taille}
    >
      <div className="jauge-tracé">
        <JaugeDeProgressionSVG
          pourcentage={pourcentage}
          taille={taille}
        />
        <p className={`jauge-valeur ${classesÀPartirDeTaille[taille].valeur}`}>
          { `${pourcentage?.toFixed(0) ?? '- '}%` }
        </p>
      </div>
      <p className={`fr-text--xs fr-mb-0 ${classesÀPartirDeTaille[taille].libellé}`}>
        {libellé}
      </p>
    </JaugeDeProgressionStyled>
  );
}
