import CarteSqueletteProps from './CarteSquelette.interface';
import styles from './CarteSquelette.module.scss';

export default function CarteSquelette({ children }: CarteSqueletteProps) {
  return (
    <div className={`${styles.conteneur} fr-px-3w fr-py-2w`}>
      {children}
    </div>
  );
}
