import BarreDeProgressionProps from '@/components/_commons/BarreDeProgression/BarreDeProgression.interface';
import { TypeDeCurseur } from '@/components/_commons/BarreDeProgression/Curseur/BarreDeProgressionCurseur.interface';
import BarreDeProgressionCurseur from './Curseur/BarreDeProgressionCurseur';
import BarreDeProgressionStyled, { dimensions } from './BarreDeProgression.styled';

export default function BarreDeProgression({
  taille,
  variante,
  fond = 'gris',
  valeur,
  minimum,
  médiane,
  maximum,
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
        {
          !!(minimum || médiane || maximum) &&
            <div className="conteneur-curseurs">
              {typeof minimum === 'number' &&
              <BarreDeProgressionCurseur
                typeDeCurseur={TypeDeCurseur.MINIMUM}
                valeur={minimum}
                variante={variante}
              />}
              {typeof médiane === 'number' &&
              <BarreDeProgressionCurseur
                typeDeCurseur={TypeDeCurseur.MÉDIANE}
                valeur={médiane}
                variante={variante}
              />}
              {typeof maximum === 'number' &&
              <BarreDeProgressionCurseur
                typeDeCurseur={TypeDeCurseur.MAXIMUM}
                valeur={maximum}
                variante={variante}
              />}
            </div>
        }
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
