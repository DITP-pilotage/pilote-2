import FiltreGroupe from './FiltresGroupe';
import SélecteurMultiple from './SélecteurMultiple';
import styles from './FiltresChantiers.module.scss';
import FiltreTitre from './FiltresTitre';

export default function FiltresChantiers() {
  return (
    <>
      <FiltreTitre>
        Filtrer les chantiers
      </FiltreTitre>
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