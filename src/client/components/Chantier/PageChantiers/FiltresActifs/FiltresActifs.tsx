import Tag from '@/client/components/_commons/Tag/Tag';
import { actions as actionsFiltreStore } from '@/client/stores/useFiltresStore/useFiltresStore';
import PérimètreMinistériel from '@/server/domain/périmètreMinistériel/périmètreMinistériel.interface';
import styles from './FiltresActifs.module.scss';

interface FiltresActifsProps {
  périmètresMinistériels: PérimètreMinistériel[]
}

export default function FiltresActifs({ périmètresMinistériels }: FiltresActifsProps) {
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
      <div className={styles.conteneurTags}>
        {
          récupérerFiltresActifsAvecLeursCatégories().map(({ catégorie, filtreId }) => {
            const filtre = périmètresMinistériels.find((périmètreMinistériel => périmètreMinistériel.id === filtreId));
            return !filtre ? null : (
              <Tag
                fermetureCallback={() => désactiverUnFiltre(filtre.id, catégorie)}
                key={`tag-${filtre.id}`}
                libellé={filtre.nom}
              />
            );
          })
        }
      </div>
      <div className="fr-mt-1w">
        <button
          className={`${styles.boutons} fr-btn fr-btn--tertiary`}
          onClick={désactiverTousLesFiltres}
          type="button"
        >
          Réinitialiser les filtres
        </button>
      </div>
    </div>
  );
}
