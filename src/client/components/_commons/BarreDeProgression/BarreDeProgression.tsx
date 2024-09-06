import { FunctionComponent } from 'react';
import BarreDeProgressionStyled from './BarreDeProgression.styled';

type BarreDeProgressionTaille = 'xxs' | 'xs' | 'sm' | 'md' | 'lg';
type BarreDeProgressionVariante = 'primaire' | 'primaire-light' | 'secondaire' | 'rose' | 'jaune-moutarde';
type BarreDeProgressionFond = 'bleu' | 'blanc' | 'gris-moyen' | 'gris-clair';
type BarreDeProgressionBordure = 'bleu' | 'gris-moyen' | null;
type BarreDeProgressionPositionTexte = 'côté' | 'dessus';


interface BarreDeProgressionProps {
  taille: BarreDeProgressionTaille,
  variante: BarreDeProgressionVariante,
  fond?: BarreDeProgressionFond,
  bordure?: BarreDeProgressionBordure,
  valeur: number | null,
  positionTexte?: BarreDeProgressionPositionTexte,
  afficherTexte?: boolean,
}

const dimensions = {
  xxs: { classNameDsfr: 'fr-text--xs' },
  xs: { classNameDsfr: 'fr-text--xs' },
  sm: { classNameDsfr: 'fr-text--xs' },
  md: { classNameDsfr: 'fr-text--sm' },
  lg: { classNameDsfr: 'fr-h1' },
};

const BarreDeProgression: FunctionComponent<BarreDeProgressionProps> = ({
  taille,
  variante,
  fond = 'gris-moyen',
  bordure = 'gris-moyen',
  positionTexte = 'côté',
  valeur,
  afficherTexte = true,
}) => {
  const pourcentageAffiché = valeur === null ? '- %' : `${valeur.toFixed(0)} %`;

  return (
    <BarreDeProgressionStyled
      className={`barre-de-progression flex texte-${positionTexte}`}
    >
      <div className='barre'>
        <progress
          className={`progress--${taille} progress--${fond}${bordure ? ` progress--border-${bordure}` : ''}${valeur ? ` progress--${variante}` : ''}`}
          max='100'
          value={valeur ?? 0}
        >
          {pourcentageAffiché}
        </progress>
      </div>
      {
        !!afficherTexte && (
          <div className={`pourcentage texte-${positionTexte}`}>
            <p
              className={`${dimensions[taille].classNameDsfr} pourcentage--${fond} pourcentage--${taille} fr-mb-0 bold`}
            >
              {pourcentageAffiché}
            </p>
          </div>
        )
      }
    </BarreDeProgressionStyled>
  );
};

export default BarreDeProgression;
