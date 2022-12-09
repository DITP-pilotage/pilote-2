import BarreDeProgressionProps from '@/components/_commons/BarreDeProgression/BarreDeProgression.interface';
import styles from './BarreDeProgression.base.module.scss';
import stylesÀPartirDeLaVariante from './BarreDeProgression.variantes.module.scss';
import stylesÀPartirDeLaTaille from './BarreDeProgression.tailles.module.scss';
import stylesÀPartirDuFond from './BarreDeProgression.fonds.module.scss';

export default function BarreDeProgression({
  taille,
  variante,
  fond = 'gris',
  valeur,
}: BarreDeProgressionProps) {
  const pourcentageAffiché = valeur ? `${(100 * valeur).toFixed(0)}%` : '- %';
  return (
    <div className={`
      flex fr-grid-row--middle
      ${styles.barre}
      ${stylesÀPartirDuFond[fond]}
      ${stylesÀPartirDeLaVariante[variante]}
      ${stylesÀPartirDeLaTaille[taille]}`}
    >
      <progress
        value={valeur ?? undefined}
      >
        {pourcentageAffiché}
      </progress>
      <p className={`
        fr-mb-0 bold
        ${taille === 'grande' ? 'fr-h1' : 'fr-text--xs'}`}
      >
        {pourcentageAffiché}
      </p>
    </div>
  );
}
