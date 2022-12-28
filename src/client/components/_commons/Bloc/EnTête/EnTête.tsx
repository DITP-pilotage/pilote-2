import EnTêteProps from '@/components/_commons/Bloc/EnTête/EnTête.interface';
import styles from './EnTête.module.scss';

export default function EnTête({ libellé }: EnTêteProps) {
  return (
    <div className={`${styles.conteneur} fr-p-2w`}>
      { libellé }
    </div>
  );
}
