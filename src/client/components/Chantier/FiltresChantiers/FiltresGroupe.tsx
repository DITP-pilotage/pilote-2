import FiltreGroupeProps from './FiltresGroupe.interface';
import styles from './FiltresGroupe.module.scss';

export default function FiltreGroupe({ titre, children }: FiltreGroupeProps) {
  return (
    <div className="fr-p-3w">
      <p className={`${styles.titre} fr-pb-1w`}>
        { titre }
      </p>
      { children }
    </div>
  );
}