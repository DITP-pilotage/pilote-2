import '@gouvfr/dsfr/dist/component/search/search.min.css';
import '@gouvfr/dsfr/dist/component/input/input.min.css';
import BarreDeRechercheProps from './BarreDeRecherche.interface';
import BarreDeRechercheStyled from './BarreDeRecherche.styled';

export default function BarreDeRecherche({ changementDeLaRechercheCallback, valeur = '' }: BarreDeRechercheProps) {
  return (
    <BarreDeRechercheStyled
      className='fr-search-bar'
      role="search"
    >
      <input
        className="fr-input"
        onChange={changementDeLaRechercheCallback}
        placeholder="Rechercher"
        type="search"
        value={valeur}
      />
      <div
        aria-hidden
        className="fr-btn"
        title="Rechercher"
      >
        Rechercher
      </div>
    </BarreDeRechercheStyled>
  );
}
