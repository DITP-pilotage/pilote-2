import FiltreGroupe from './FiltresGroupe/FiltresGroupe';
import SélecteurMultiple from './SélecteurMultiple/SélecteurMultiple';
import FiltresChantiersProps from './FiltresChantiers.interface';
import styles from './FiltresChantiers.module.scss';

export default function FiltresChantiers({ estOuvert, setEstOuvert, périmètresMinistériels }: FiltresChantiersProps) {

  return (
    <div className={`${styles.barreLatérale} ${estOuvert ? styles.barreEstOuverte : ''}`}>
      <div className="flex justifyBetween">
        <p className="uppercase bold fr-text--lg fr-mb-0 fr-pt-3w fr-px-3w">
          Filtrer les chantiers
        </p>
        <button
          aria-label="Fermer les filtres"
          className="bold fr-sr-only-lg fr-text--xl fr-mb-0 fr-mt-2v fr-mx-1w fr-p-2v fr-px-2w"
          onClick={() => setEstOuvert(false)}
          type="button"
        >
          &times;
        </button>
      </div>
      <FiltreGroupe titre="Périmètres thématiques" >
        <SélecteurMultiple
          libellé='Périmètres ministériels'
          périmètresMinistériels={périmètresMinistériels}
        />
      </FiltreGroupe>
    </div>
  );
}
