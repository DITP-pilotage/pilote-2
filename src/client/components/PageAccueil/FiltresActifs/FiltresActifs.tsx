import Tag from '@/components/_commons/Tag/Tag';
import { actions as actionsFiltreStore } from '@/stores/useFiltresStore/useFiltresStore';
import FiltresActifsStyled from './FiltresActifs.styled';
import FiltresActifsProps from './FiltresActifs.interface';

export default function FiltresActifs({ ministères } : FiltresActifsProps) {
  const {
    récupérerFiltresActifsAvecLeursCatégories,
    désactiverUnFiltre,
    désactiverTousLesFiltres,
    récupérerNombreFiltresActifs,
  } = actionsFiltreStore();

  const nombreFiltresActifs = récupérerNombreFiltresActifs();

  const ministèresAvecUnSeulPérimètre = new Set(
    ministères
      .filter((ministère) => ministère.périmètresMinistériels.length === 1)
      .map((ministère) => ministère.id),
  );

  return (
    <FiltresActifsStyled
      className='fr-px-4w fr-py-2w'
      id="filtres-actifs"
    >
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
                  libellé={'ministèreId' in filtre ? (ministèresAvecUnSeulPérimètre.has(filtre.ministèreId) ? filtre.ministèreNom : filtre.nom) : filtre.nom}
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
