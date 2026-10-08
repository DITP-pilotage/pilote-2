import {
  parseAsBoolean,
  ParserBuilder,
  useQueryState,
  useQueryStates,
} from "nuqs";
import { CollapsibleSection } from "@/components/shared/CollapsibleSection";
import { CheckboxField } from "@/components/shared/Checkbox";
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
        <ul className="m-0 mb-2 list-none p-0 pl-2">
          {listeCategorieDeFiltre.map((filtre) => (
            <li className="my-2 mr-0 p-0" key={filtre}>
              <CheckboxField
                checked={filtresNew[filtre] ?? false}
                className="pb-2"
                id={filtre}
                label={valuesFiltres[filtre]}
                onCheckedChange={() => {
                  sauvegarderFiltres({ [filtre]: !filtresNew[filtre] });
                  setPagination(null);
                  return setListeFiltresNew({
                    ...filtresNew,
                    [filtre]: !filtresNew[filtre],
                  });
                }}
              />
            </li>
          ))}
        </ul>
      </CollapsibleSection>
    </div>
  );
};
