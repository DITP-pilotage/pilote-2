import Tag from '@/client/components/_commons/Tag/Tag';
import { actions as actionsFiltreStore } from '@/client/stores/useFiltresStore/useFiltresStore';
import FiltresActifsStyled from './FiltresActifs.styled';

export default function FiltresActifs() {
  const {
    récupérerFiltresActifsAvecLeursCatégories,
    désactiverUnFiltre,
    désactiverTousLesFiltres,
    récupérerNombreFiltresActifs,
  } = actionsFiltreStore();

  const nombreFiltresActifs = récupérerNombreFiltresActifs();

  return (
    <FiltresActifsStyled className='fr-px-4w fr-py-2w'>
      <p className="fr-text--xs fr-mb-1w">
        <span className="bold">
          {nombreFiltresActifs}
        </span>
        {' '}
        {nombreFiltresActifs > 1 ? 'filtres actifs sur cette page' : 'filtre actif sur cette page'}
      </p>
      <ul
        aria-label="liste des tags des filtres actifs"
        className='conteneur-tags'
      >
        {
          récupérerFiltresActifsAvecLeursCatégories().map(({ catégorie, filtre }) =>
            (
              <li
                key={`tag-${filtre.id}`}
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
        className='boutons fr-btn fr-btn--tertiary fr-mt-1w'
        onClick={désactiverTousLesFiltres}
        type="button"
      >
        Réinitialiser les filtres
      </button>
    </FiltresActifsStyled>
  );
}
