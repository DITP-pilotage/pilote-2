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

  const nombreFiltresActifs = récupérerNombreFiltresActifs();

  return (
    <div className={`${styles.filtresActifs} fr-px-4w fr-py-2w`}>
      <p className="fr-text--xs fr-mb-1w">
        <span className="bold">
          {nombreFiltresActifs}
        </span>
        {' '}
        {nombreFiltresActifs > 1 ? 'filtres actifs sur cette page' : 'filtre actif sur cette page'}
      </p>
      <ul
        aria-label="liste des tags des filtres actifs"
        className={styles.conteneurTags}
      >
        {
          récupérerFiltresActifsAvecLeursCatégories().map(({ catégorie, filtre }) =>
            (
            //eslint-disable-next-line jsx-a11y/no-redundant-roles
              <li
                key={`tag-${filtre.id}`}
                role='listitem'
              >
                <Tag
                  libellé={filtre.nom}
                  suppressionCallback={() => désactiverUnFiltre(filtre.id, catégorie)}
                />
              </li>

            ),
          )
        }
      </ul>
      <button
        className={`${styles.boutons} fr-btn fr-btn--tertiary fr-mt-1w`}
        onClick={désactiverTousLesFiltres}
        type="button"
      >
        Réinitialiser les filtres
      </button>
    </div>
  );
}
