import { parseAsInteger, parseAsString, useQueryState } from "nuqs";
import { FunctionComponent } from "react";
import { sauvegarderFiltres } from "@/stores/useFiltresStoreNew/useFiltresStoreNew";
import FiltresSélectionMultipleStyled from "./FiltresSelectionMultiple.styled";

interface Filtre {
  id: string;
  nom: string;
}

interface FiltresSelectionMultipleProps {
  catégorieDeFiltre: "axes" | "territorialisation";
  filtres: Filtre[];
  libelle: string;
}

export const FiltresSelectionMultiple: FunctionComponent<
  FiltresSelectionMultipleProps
> = ({ catégorieDeFiltre, libelle, filtres }) => {
  const [filtresNew, setListeFiltresNew] = useQueryState(
    catégorieDeFiltre,
    parseAsString.withDefault("").withOptions({
      shallow: false,
      clearOnDefault: true,
      history: "push",
    }),
  );

  const [, setPagination] = useQueryState(
    "pageIndex",
    parseAsInteger.withDefault(1).withOptions({
      shallow: false,
    }),
  );

  return (
    <FiltresSélectionMultipleStyled>
      <button
        aria-controls={`fr-sidemenu-item-${catégorieDeFiltre}`}
        aria-expanded="false"
        className="fr-sidemenu__btn fr-m-0 fr-text--sm"
        type="button"
      >
        {libelle}
      </button>
      <div className="fr-collapse" id={`fr-sidemenu-item-${catégorieDeFiltre}`}>
        <ul className="fr-p-0 fr-m-0 fr-mb-1w fr-pl-1w">
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
                    sauvegarderFiltres({ [catégorieDeFiltre]: arrFiltresNew });
                    setPagination(1);
                    return setListeFiltresNew(arrFiltresNew.join(","));
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
    </FiltresSélectionMultipleStyled>
  );
};
