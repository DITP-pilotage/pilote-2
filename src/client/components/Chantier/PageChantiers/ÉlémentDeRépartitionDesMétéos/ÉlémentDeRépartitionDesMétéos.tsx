import ÉlémentDeRépartitionDesMétéosProps from './ÉlémentDeRépartitionDesMétéos.interface';
import Image from 'next/image';
import styles from '../PageChantiers.module.scss';

export default function ÉlémentDeRépartitionDesMétéos({ météo, nombreDeChantiers }: ÉlémentDeRépartitionDesMétéosProps) {
  return (
    <div className={styles.bordure + ' fr-grid-row fr-mx-1w'}>
      <div className='fr-col-3'>
        <span>
          {nombreDeChantiers}
        </span>
      </div>
      <div className='fr-col-9'>
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