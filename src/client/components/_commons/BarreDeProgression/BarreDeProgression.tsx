import BarreDeProgressionProps from '@/components/_commons/BarreDeProgression/BarreDeProgression.interface';
import BarreDeProgressionStyled, { dimensions } from './BarreDeProgression.styled';

export default function BarreDeProgression({
  taille,
  variante,
  fond = 'gris',
  bordure = 'gris',
  positionTexte = 'côté',
  valeur,
  afficherTexte = true,
}: BarreDeProgressionProps) {
  const pourcentageAffiché = valeur === null ? '- %' : `${valeur.toFixed(0)} %`;

  return (
    <BarreDeProgressionStyled
      bordure={bordure}
      className={`flex fr-pb-1v ${positionTexte}`}
      fond={fond}
      positionTexte={positionTexte}
      taille={taille}
      variante={variante}
    >
      <div className="barre">
        <progress
          max="100"
          value={valeur ?? undefined}
        >
          {pourcentageAffiché}
        </progress>
      </div>
      {
        !!afficherTexte && (
          <div className='pourcentage'>
            <p className={`${dimensions[taille].classNameDsfr}  fr-mb-0 bold`}>
              {pourcentageAffiché}
            </p>
          </div>
        )
      }
    </BarreDeProgressionStyled>
  );
}
