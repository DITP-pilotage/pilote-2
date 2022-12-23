import BarreDeProgressionProps from '@/components/_commons/BarreDeProgression/BarreDeProgression.interface';
import {
  TypeDeCurseur,
} from '@/components/_commons/BarreDeProgression/Curseur/BarreDeProgressionCurseur.interface';
import BarreDeProgressionCurseur from './Curseur/BarreDeProgressionCurseur';
import styles from './BarreDeProgression.base.module.scss';
import stylesÀPartirDeLaVariante from './BarreDeProgression.variante.module.scss';
import stylesÀPartirDeLaTaille from './BarreDeProgression.taille.module.scss';
import stylesÀPartirDuFond from './BarreDeProgression.fond.module.scss';

export default function BarreDeProgression({
  taille,
  variante,
  fond = 'gris',
  valeur,
  afficherLesCurseurs = true,
}: BarreDeProgressionProps) {
  let pourcentageAffiché:string = '- %';
  if (valeur) {
    pourcentageAffiché = typeof valeur === 'number' ? `${(100 * valeur).toFixed(0)} %` : `${(100 * valeur.moyenne).toFixed(0)}%`;
  }

  return (
    <div className={`
      flex fr-grid-row--middle fr-pb-1v
      ${styles.conteneur}
      ${stylesÀPartirDuFond[fond]}
      ${stylesÀPartirDeLaVariante[variante]}
      ${stylesÀPartirDeLaTaille[taille]}`}
    >
      <div className={`${styles.barre}`}>
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
            !!(valeur !== null && afficherLesCurseurs && typeof valeur === 'object') && (
              <div className={styles.conteneurCurseurs}>
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
      <div className={`${styles.pourcentage}`}>
        <p className={`
        fr-mb-0 bold
        ${taille === 'grande' ? 'fr-h1' : 'fr-text--xs'}`}
        >
          {pourcentageAffiché}
        </p>
      </div>
    </div>
  );
}
