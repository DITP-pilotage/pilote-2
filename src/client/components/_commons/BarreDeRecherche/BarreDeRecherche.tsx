import "@gouvfr/dsfr/dist/component/search/search.min.css";
import "@gouvfr/dsfr/dist/component/input/input.min.css";
import { ChangeEventHandler, FunctionComponent } from "react";

const BarreDeRecherche: FunctionComponent<{
  changementDeLaRechercheCallback: ChangeEventHandler<HTMLInputElement>;
  valeur?: string;
}> = ({ changementDeLaRechercheCallback, valeur = "" }) => {
  return (
    <div className="fr-search-bar w-full" role="search">
      <input
        className="fr-input bg-dsfr-alt-blue-france"
        onChange={changementDeLaRechercheCallback}
        placeholder="Rechercher"
        type="search"
        value={valeur}
      />
      <div aria-hidden className="fr-btn" title="Rechercher">
        Rechercher
      </div>
    </div>
  );
};

export default BarreDeRecherche;
