import FiltreGroupe from './FiltresGroupe/FiltresGroupe';
import SélecteurMultiple from './SélecteurMultiple/SélecteurMultiple';
import styles from './FiltresChantiers.module.scss';

export default function FiltresChantiers() {
  return (
    <div className={styles.barreLatérale}>
      <p className="uppercase bold fr-text--lg fr-mb-0 fr-pt-3w fr-px-3w">
        Filtrer les chantiers
      </p>
      <FiltreGroupe titre="Périmètres thématiques" >
        <SélecteurMultiple libellé='Périmètres ministériels' />
        <SélecteurMultiple libellé='Axes' />
        <SélecteurMultiple libellé='PPG' />
      </FiltreGroupe>
    </div>
  );
}