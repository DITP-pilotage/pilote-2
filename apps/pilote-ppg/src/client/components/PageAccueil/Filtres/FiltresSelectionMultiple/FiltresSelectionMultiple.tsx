import { parseAsString, useQueryState } from "nuqs";
import { CollapsibleSection } from "@/components/shared/CollapsibleSection";
import { CheckboxField } from "@/components/shared/Checkbox";
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
      <CollapsibleSection title={libelle}>
        <ul className="m-0 mb-2 list-none p-0 pl-2">
          {filtres.map((filtre) => (
            <li className="my-2 mr-0 p-0" key={filtre.id}>
              <CheckboxField
                checked={filtresNew.includes(filtre.id)}
                className="pb-2"
                id={filtre.id}
                label={filtre.nom}
                onCheckedChange={() => {
                  let arrFiltresNew = filtresNew.split(",").filter(Boolean);
                  if (arrFiltresNew.includes(filtre.id)) {
                    arrFiltresNew.splice(arrFiltresNew.indexOf(filtre.id), 1);
                  } else {
                    arrFiltresNew.push(filtre.id);
                  }
                  onChange(arrFiltresNew);
                }}
              />
            </li>
          ))}
        </ul>
      </CollapsibleSection>
    </div>
  );
};
