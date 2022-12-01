import FiltreGroupe from './FiltresGroupe';
import SélecteurMultiple from './SélecteurMultiple';
import styles from './FiltresChantiers.module.scss';

export default function FiltresChantiers() {
  return (
    <>
      <FiltreGroupe titre="Périmètres thématiques" >
        <>
          <SélecteurMultiple libellé='Périmètres ministériels' />
          <SélecteurMultiple libellé='Axes' />
          <SélecteurMultiple libellé='PPG' />
        </>
      </FiltreGroupe>
      <hr className={styles.séparateur} />
    </>
  );
}