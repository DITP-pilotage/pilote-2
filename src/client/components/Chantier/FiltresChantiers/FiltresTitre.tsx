import styles from './FiltresTitre.module.scss';
import FiltreTitreProps from './FiltreTitre.interface';

export default function FiltreTitre({ children }: FiltreTitreProps) {
  return (
    <div className={`${styles.text} fr-pt-3w fr-px-3w`}>
      { children }
    </div>
  );
}