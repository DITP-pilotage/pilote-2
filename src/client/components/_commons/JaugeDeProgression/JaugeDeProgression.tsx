import {
  JaugeDeProgressionProps,
} from '@/components/_commons/JaugeDeProgression/JaugeDeProgression.interface';
import JaugeDeProgressionSVG from '@/components/_commons/JaugeDeProgression/JaugeDeProgressionSVG';
import JaugeDeProgressionStyled from './JaugeDeProgression.styled';

const classesÀPartirDeTaille = {
  petite: {
    valeur: 'jauge-valeur-dessous fr-h4',
    valeur_non_renseignée: 'jauge-valeur-dessous fr-text--xs',
    libellé: 'fr-text--xs',
  },
  grande: {
    valeur: 'jauge-valeur-centré fr-display--xs',
    valeur_non_renseignée: 'jauge-valeur-centré fr-text--xs',
    libellé: 'jauge-libellé-centré fr-text--xs',
  },
};

export default function JaugeDeProgression({  couleur, libellé, pourcentage, taille  }: JaugeDeProgressionProps ) {
  return (
    <JaugeDeProgressionStyled
      couleur={couleur}
      taille={taille}
    >
      <JaugeDeProgressionSVG
        pourcentage={pourcentage}
        taille={taille}
      />
      {
        pourcentage
          ?
            <p className={classesÀPartirDeTaille[taille].valeur}>
              { `${pourcentage?.toFixed(0)}%` }
            </p>
          :
            <p className={classesÀPartirDeTaille[taille].valeur_non_renseignée}>
              Non renseigné
            </p>
      }
      <p className={classesÀPartirDeTaille[taille].libellé}>
        {libellé}
      </p>
    </JaugeDeProgressionStyled>
  );
}
