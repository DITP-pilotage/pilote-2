import BarreDeProgressionProps from '@/components/_commons/BarreDeProgression/BarreDeProgression.interface';
import BarreDeProgressionStyled, { dimensions } from './BarreDeProgression.styled';

export default function BarreDeProgression({
  taille,
  variante,
  fond = 'gris',
  valeur,
  afficherTexte = true,
}: BarreDeProgressionProps) {
  const pourcentageAffiché = valeur === null ? '- %' : `${valeur.toFixed(0)} %`;

  return (
    <BarreDeProgressionStyled
      className="flex fr-grid-row--middle fr-pb-1v"
      fond={fond}
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
