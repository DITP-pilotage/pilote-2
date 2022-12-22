import {
  TypeDeCurseur,
} from '@/components/_commons/BarreDeProgression/Curseur/BarreDeProgressionCurseur.interface';
import {
  barreDeProgressionCurseurGéométries,
} from '@/components/_commons/BarreDeProgression/Curseur/BarreDeProgressionCurseur';
import styles from './BarreDeProgressionLégendeÉlément.module.scss';

interface BarreDeProgressionLégendeÉlémentProps {
  typeDeCurseur: TypeDeCurseur,
  libellé: string,
}

export default function BarreDeProgressionLégendeÉlément({ typeDeCurseur, libellé }: BarreDeProgressionLégendeÉlémentProps) {
  return (
    <>
      <svg
        className={styles.curseur}
        viewBox="-12 -20 24 24"
        width="0.75rem"
        xmlns="http://www.w3.org/2000/svg"
      >
        {barreDeProgressionCurseurGéométries[typeDeCurseur]}
      </svg>
      <span className="fr-pl-1v fr-m-0 fr-text--xs">
        {libellé}
      </span>
    </>
  );
}
