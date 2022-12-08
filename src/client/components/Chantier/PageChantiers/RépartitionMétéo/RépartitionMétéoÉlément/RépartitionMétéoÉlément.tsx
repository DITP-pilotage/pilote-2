import Image from 'next/image';
import RépartitionMétéoÉlémentProps from './RépartitionMétéoÉlément.interface';
import styles from './RépartitionMétéoÉlément.module.scss';

export default function RépartitionMétéoÉlément({ météo, nombreDeChantiers }: RépartitionMétéoÉlémentProps) {
  return (
    <>
      <Image
        alt=''
        className="fr-grid-row"
        src={météo.picto}
      />
      <p className={`${styles.nombreDeChantiers} fr-grid-row fr-h1 fr-mb-0`}>
        {nombreDeChantiers}
      </p>
      <p className={`${styles.label} fr-grid-row fr-mb-0 fr-text--sm`}>
        {météo.label}
      </p>
    </>
  );
}
