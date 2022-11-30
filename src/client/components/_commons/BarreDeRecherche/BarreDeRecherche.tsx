import '@gouvfr/dsfr/dist/component/search/search.min.css';
import '@gouvfr/dsfr/dist/component/input/input.min.css';
import BarreDeRechercheProps from './BarreDeRecherche.interface';

export default function BarreDeRecherche({ onChange, valeur }: BarreDeRechercheProps) {
  return (
    <div
      className='fr-search-bar'
      id="header-search"
      role="search"
    >
      <input
        className="fr-input"
        onChange={onChange}
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