import ÉlémentDeRépartitionDesMétéosProps from './ÉlémentDeRépartitionDesMétéos.interface';
import Image from 'next/image';
import styles from '../PageChantiers.module.scss';

export default function ÉlémentDeRépartitionDesMétéos({ météo, nombreDeChantiers }: ÉlémentDeRépartitionDesMétéosProps) {
  return (
    <div className={styles.bordure + ' fr-grid-row fr-mx-1w fr-grid-row--center fr-grid-row--middle fr-p-1w'}>
      <div className='fr-col-3'>
        <span className={styles.nombreDeChantiers}>
          {nombreDeChantiers}
        </span>
      </div>
      <div className={styles.labelMétéo + ' fr-col-9'}>
        <span>
          {météo.label}
        </span>
      </div>
      <Image
        alt={'picto ' + météo.label}
        src={météo.picto}
        width={35}
      />
    </div>
  );
}
