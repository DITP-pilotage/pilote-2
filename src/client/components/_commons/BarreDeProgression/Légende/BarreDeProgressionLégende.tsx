import {
  TypeDeCurseur,
} from '@/components/_commons/BarreDeProgression/Curseur/BarreDeProgressionCurseur.interface';
import BarreDeProgressionLégendeÉlément from './Élément/BarreDeProgressionLégendeÉlément';
import styles from './BarreDeProgressionLégende.module.scss';

export default function BarreDeProgressionLégende() {
  return (
    <ul className={styles.légendeBarreDeProgressionCurseurs}>
      <li className={`${styles.curseurConteneur} fr-pr-2w`}>
        <BarreDeProgressionLégendeÉlément
          libellé="Minimum"
          typeDeCurseur={TypeDeCurseur.MINIMUM}
        />
      </li>
      <li className={`${styles.curseurConteneur} fr-pr-2w`}>
        <BarreDeProgressionLégendeÉlément
          libellé="Médiane"
          typeDeCurseur={TypeDeCurseur.MÉDIANE}
        />
      </li>
      <li className={`${styles.curseurConteneur} fr-pr-2w`}>
        <BarreDeProgressionLégendeÉlément
          libellé="Maximum"
          typeDeCurseur={TypeDeCurseur.MAXIMUM}
        />
      </li>
    </ul>
  );
}
