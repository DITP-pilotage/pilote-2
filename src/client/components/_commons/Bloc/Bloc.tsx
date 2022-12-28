import BlocProps from './Bloc.interface';
import styles from './Bloc.module.scss';

export default function Bloc({ children }: BlocProps) {
  return (
    <div className={`${styles.conteneur} fr-px-3w fr-py-2w`}>
      {children}
    </div>
  );
}
