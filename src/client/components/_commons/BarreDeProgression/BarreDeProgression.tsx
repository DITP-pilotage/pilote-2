import BarreDeProgressionProps from '@/components/_commons/BarreDeProgression/BarreDeProgression.interface';
import BarreDeProgressionStyled from './BarreDeProgression.styled';

const dimensions = {
  xxs: {  classNameDsfr: 'fr-text--xs' },
  xs: {  classNameDsfr: 'fr-text--xs' },
  sm: {  classNameDsfr: 'fr-text--xs' },
  md: {  classNameDsfr: 'fr-text--sm' },
  lg: { classNameDsfr: 'fr-h1' },
};

export default function BarreDeProgression({
  taille,
  variante,
  fond = 'gris-moyen',
  bordure = 'gris-moyen',
  positionTexte = 'côté',
  valeur,
  afficherTexte = true,
}: BarreDeProgressionProps) {
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
}
