import BarreDeProgressionProps from '@/components/_commons/BarreDeProgression/BarreDeProgression.interface';
import {
  TypeDeCurseur,
} from '@/components/_commons/BarreDeProgression/Curseur/BarreDeProgressionCurseur.interface';
import BarreDeProgressionCurseur from './Curseur/BarreDeProgressionCurseur';
import BarreDeProgressionStyled, { dimensions } from './BarreDeProgression.styled';

export default function BarreDeProgression({
  taille,
  variante,
  fond = 'gris',
  valeur,
  afficherCurseurs = true,
  afficherTexte = true,
}: BarreDeProgressionProps) {
  const pourcentageAffiché = valeur === null ? '- %' : (
    typeof valeur === 'number'
      ? `${(100 * valeur).toFixed(0)} %`
      : `${(100 * valeur.moyenne).toFixed(0)}%`
  );

  return (
    <BarreDeProgressionStyled
      className='flex fr-grid-row--middle fr-pb-1v'
      fond={fond}
      taille={taille}
      variante={variante}
    >
      <div className='barre'>
        {
          typeof valeur === 'number'
            ?
              <progress
                value={valeur}
              >
                {pourcentageAffiché}
              </progress>
            :
              <progress
                value={valeur ? valeur.moyenne : undefined}
              >
                {pourcentageAffiché}
              </progress>
        }
        {
            !!(valeur !== null && afficherCurseurs && typeof valeur === 'object') && (
              <div className='conteneur-curseurs'>
                <BarreDeProgressionCurseur
                  typeDeCurseur={TypeDeCurseur.MINIMUM}
                  valeur={valeur.minimum}
                  variante={variante}
                />
                <BarreDeProgressionCurseur
                  typeDeCurseur={TypeDeCurseur.MÉDIANE}
                  valeur={valeur.médiane}
                  variante={variante}
                />
                <BarreDeProgressionCurseur
                  typeDeCurseur={TypeDeCurseur.MAXIMUM}
                  valeur={valeur.maximum}
                  variante={variante}
                />
              </div>
            )
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
