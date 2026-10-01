import { FunctionComponent } from "react";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import { SelectField } from "@/components/shared/SelectField";
import { useSelecteurJalon } from "./useSelecteurJalon";

export const SelecteurJalon: FunctionComponent = () => {
  const { listeOptionsJalon, listeJalonAAfficher, jalonAAfficherParDefaut } =
    useSelecteurJalon();

  const [jalon, setJalon] = useQueryState(
    "jalon",
    parseAsStringLiteral(listeJalonAAfficher)
      .withDefault(jalonAAfficherParDefaut)
      .withOptions({
        shallow: false,
        clearOnDefault: true,
        history: "push",
      }),
  );

  return (
    <SelectField
      className="mr-2"
      name="jalon"
      onChange={(valeur) => setJalon(valeur)}
      options={listeOptionsJalon}
      triggerClassName="w-28"
      value={jalon}
    />
  );
};
