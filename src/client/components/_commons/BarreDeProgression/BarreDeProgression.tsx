import BarreDeProgressionProps from '@/components/_commons/BarreDeProgression/BarreDeProgression.interface';
import styles from './BarreDeProgression.module.scss';

const stylesÀPartirDeLaVariante = {
  primaire: styles.barrePrimaire,
  secondaire: styles.barreSecondaire,
};

const stylesÀPartirDeLaTaille = {
  sm: {
    barre: styles.barreSm,
    libellé: 'fr-text--xs',
  },
  lg: {
    barre: styles.barreLg,
    libellé: 'fr-h1',
  },
};

const stylesÀPartirDuFond = {
  gris: styles.barreFondGris,
  blanc: styles.barreFondBlanc,
};

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
      ${stylesÀPartirDeLaTaille[taille].barre}`}
    >
      <progress
        value={valeur ?? undefined}
      >
        {pourcentageAffiché}
      </progress>
      <p className={`fr-mb-0 bold ${stylesÀPartirDeLaTaille[taille].libellé}`}>
        {pourcentageAffiché}
      </p>
    </div>
  );
}
