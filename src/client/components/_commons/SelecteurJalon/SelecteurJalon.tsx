import { FunctionComponent } from "react";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import { useSelecteurJalon } from "./useSelecteurJalon";

const SelecteurJalon: FunctionComponent = () => {
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
    <select
      className="fr-select fr-mt-0 fr-mr-1w"
      id="jalon"
      onChange={(e) => setJalon(e.target.value as "2024" | "2025")}
      value={jalon}
    >
      {listeOptionsJalon.map((option) => (
        <option key={option.valeur} value={option.valeur}>
          {option.libellé}
        </option>
      ))}
    </select>
  );
};

export default SelecteurJalon;
