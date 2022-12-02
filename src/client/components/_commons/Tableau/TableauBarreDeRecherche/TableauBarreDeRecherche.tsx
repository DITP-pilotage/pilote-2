import '@gouvfr/dsfr/dist/component/search/search.min.css';
import '@gouvfr/dsfr/dist/component/input/input.min.css';
import TableauBarreDeRechercheProps from './TableauBarreDeRecherche.interface';

export default function TableauBarreDeRecherche({ changementDeLaRechercheGénéraleCallback, valeur }: TableauBarreDeRechercheProps) {
  return (
    <div
      className='fr-search-bar'
      id="header-search"
      role="search"
    >
      <input
        className="fr-input"
        onChange={changementDeLaRechercheGénéraleCallback}
        placeholder="Rechercher"
        type='text'
        value={valeur ?? ''}
      />
      <button
        className="fr-btn"
        title="Rechercher"
        type="button"
      >
        Rechercher
      </button>
    </div>
  );
}
