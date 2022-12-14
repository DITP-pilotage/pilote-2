import Tag from '@/client/components/_commons/Tag/Tag';
import { actions as actionsFiltreStore } from '@/client/stores/useFiltresStore/useFiltresStore';
import styles from './FiltresActifs.module.scss';

export default function FiltresActifs() {
  const {
    récupérerFiltresActifsAvecLeursCatégories,
    désactiverUnFiltre,
    désactiverTousLesFiltres,
    récupérerNombreFiltresActifs,
  } = actionsFiltreStore();
  return (
    <div className={`${styles.filtresActifs} fr-px-4w fr-py-2w`}>
      <p className="fr-text--xs fr-mb-1w">
        <span className="bold">
          {récupérerNombreFiltresActifs()}
        </span>
        {' '}
        filtres actifs sur cette page
      </p>
      <div className={styles.conteneurTags}>
        {
            récupérerFiltresActifsAvecLeursCatégories().map(({ catégorie, filtre }) => (
              <Tag
                fermetureCallback={() => désactiverUnFiltre(filtre, catégorie)}
                key={`tag-${catégorie}-${filtre}`}
                libellé={filtre}
              />
            ))
        }
      </div>
      <div className="fr-mt-1w">
        <button
          className={`${styles.bouttons} fr-btn fr-btn--tertiary`}
          onClick={désactiverTousLesFiltres}
          type="button"
        >
          Réinitialiser les filtres
        </button>
      </div>
    </div>
  );
}
