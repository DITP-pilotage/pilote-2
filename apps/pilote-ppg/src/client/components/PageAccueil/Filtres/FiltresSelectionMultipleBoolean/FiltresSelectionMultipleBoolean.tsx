import {
  parseAsBoolean,
  ParserBuilder,
  useQueryState,
  useQueryStates,
} from "nuqs";
import { CollapsibleSection } from "@/components/shared/CollapsibleSection";
import { parseAsTablePage } from "@/components/shared/DataTable/urlParsers";
import { FunctionComponent } from "react";
import { sauvegarderFiltres } from "@/stores/useFiltresStore/useFiltresStore";

type AvailableFiltres = "estBarometre" | "estTerritorialise";

const valuesFiltres: Record<AvailableFiltres, string> = {
  estBarometre: "Chantiers du baromètre",
  estTerritorialise: "Chantiers territorialisés",
};

interface FiltresSelectionMultipleBooleanProps {
  listeCategorieDeFiltre: Array<AvailableFiltres>;
  libelle: string;
}

export const FiltresSelectionMultipleBoolean: FunctionComponent<
  FiltresSelectionMultipleBooleanProps
> = ({ listeCategorieDeFiltre, libelle }) => {
  const listesFiltres: Record<
    AvailableFiltres,
    ParserBuilder<boolean>
  > = listeCategorieDeFiltre.reduce(
    (acc, catégorieDeFiltre) => {
      acc[catégorieDeFiltre] = parseAsBoolean.withDefault(false).withOptions({
        shallow: false,
        clearOnDefault: true,
        history: "push",
      });
      return acc;
    },
    {} as Record<AvailableFiltres, ParserBuilder<boolean>>,
  );

  const [filtresNew, setListeFiltresNew] = useQueryStates(listesFiltres, {
    shallow: false,
    clearOnDefault: true,
    history: "push",
  });

  const [, setPagination] = useQueryState(
    "page",
    parseAsTablePage.withOptions({
      shallow: false,
    }),
  );

  return (
    <div>
      <CollapsibleSection title={libelle}>
        <ul className="fr-p-0 fr-m-0 fr-mb-1w fr-pl-1w list-none">
          {listeCategorieDeFiltre.map((filtre) => (
            <li className="fr-p-0 fr-my-1w fr-mr-0" key={filtre}>
              <div className="fr-checkbox-group fr-pb-1w">
                <input
                  checked={filtresNew[filtre] ?? false}
                  className="fr-input"
                  id={filtre}
                  onChange={() => {
                    sauvegarderFiltres({ [filtre]: !filtresNew[filtre] });
                    setPagination(null);
                    return setListeFiltresNew({
                      ...filtresNew,
                      [filtre]: !filtresNew[filtre],
                    });
                  }}
                  type="checkbox"
                />
                <label className="fr-label" htmlFor={filtre}>
                  {valuesFiltres[filtre]}
                </label>
              </div>
            </li>
          ))}
        </ul>
      </CollapsibleSection>
    </div>
  );
};
