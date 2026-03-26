import { parseAsString, useQueryState } from "nuqs";
import { FunctionComponent } from "react";

interface Filtre {
  id: string;
  nom: string;
}

interface FiltresSelectionMultipleProps {
  categorieDeFiltre: "axes" | "territorialisation";
  filtres: Filtre[];
  libelle: string;
  onChange: (valeur: string[]) => void;
}

export const FiltresSelectionMultiple: FunctionComponent<
  FiltresSelectionMultipleProps
> = ({ categorieDeFiltre, libelle, filtres, onChange }) => {
  const [filtresNew] = useQueryState(
    categorieDeFiltre,
    parseAsString.withDefault("").withOptions({
      shallow: false,
      clearOnDefault: true,
      history: "push",
    }),
  );

  return (
    <div>
      <button
        aria-controls={`fr-sidemenu-item-${categorieDeFiltre}`}
        aria-expanded="false"
        className="fr-sidemenu__btn fr-m-0 fr-text--sm w-full text-left"
        type="button"
      >
        {libelle}
      </button>
      <div className="fr-collapse" id={`fr-sidemenu-item-${categorieDeFiltre}`}>
        <ul className="fr-p-0 fr-m-0 fr-mb-1w fr-pl-1w list-none">
          {filtres.map((filtre) => (
            <li className="fr-p-0 fr-my-1w fr-mr-0" key={filtre.id}>
              <div className="fr-checkbox-group fr-pb-1w">
                <input
                  checked={filtresNew.includes(filtre.id)}
                  className="fr-input"
                  id={filtre.id}
                  onChange={() => {
                    let arrFiltresNew = filtresNew.split(",").filter(Boolean);
                    if (arrFiltresNew.includes(filtre.id)) {
                      arrFiltresNew.splice(arrFiltresNew.indexOf(filtre.id), 1);
                    } else {
                      arrFiltresNew.push(filtre.id);
                    }
                    onChange(arrFiltresNew);
                  }}
                  type="checkbox"
                />
                <label className="fr-label" htmlFor={filtre.id}>
                  {filtre.nom}
                </label>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
