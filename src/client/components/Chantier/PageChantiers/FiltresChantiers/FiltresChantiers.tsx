import FiltreGroupe from './FiltresGroupe/FiltresGroupe';
import SélecteurMultiple from './SélecteurMultiple/SélecteurMultiple';
import FiltresChantiersProps from './FiltresChantiers.interface';
import styles from './FiltresChantiers.module.scss';

export default function FiltresChantiers({ estOuvert, setEstOuvert, périmètresMinistériels }: FiltresChantiersProps) {
  return (
    <div className={`${styles.barreLatérale} ${estOuvert ? styles.barreEstOuverte : ''}`}>
      <div className="fr-grid-row fr-grid-row--middle fr-mt-2w">
        <p className="fr-h4 fr-mb-0 fr-px-3w fr-col-8">
          Filtres
        </p>
        <button
          aria-label="Fermer les filtres"
          className="bold fr-sr-only-xl fr-text--sm fr-mb-0 fr-p-1w fr-col-4"
          onClick={() => setEstOuvert(false)}
          type="button"
        >
          Fermer &times;
        </button>
      </div>
      <FiltreGroupe titre="Périmètres thématiques">
        <SélecteurMultiple
          catégorieDeFiltre='périmètresMinistériels'
          filtres={périmètresMinistériels}
          libellé='Périmètres ministériels'
        />
      </FiltreGroupe>
    </div>
  );
}
