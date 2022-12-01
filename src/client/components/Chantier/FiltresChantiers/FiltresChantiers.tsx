import FiltreGroupe from './FiltresGroupe/FiltresGroupe';
import SélecteurMultiple from './SélecteurMultiple/SélecteurMultiple';
import styles from './FiltresChantiers.module.scss';

interface FiltresChantiersProps {
  estOuvert: boolean,
  setEstOuvert: (state: boolean) => void,
}

export default function FiltresChantiers({ estOuvert, setEstOuvert }: FiltresChantiersProps) {

  return (
    <div className={`${styles['barre-laterale']} ${estOuvert ? styles['barre-est-ouverte'] : ''}`}>
      <div className="flex justify-between">
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
        <SélecteurMultiple libellé='Périmètres ministériels' />
        <SélecteurMultiple libellé='Axes' />
        <SélecteurMultiple libellé='PPG' />
      </FiltreGroupe>
    </div>
  );
}