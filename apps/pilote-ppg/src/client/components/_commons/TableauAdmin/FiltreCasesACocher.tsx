import type { Column } from "@tanstack/react-table";
import { useId } from "react";
import { Checkbox } from "@/components/shared/Checkbox";

export type OptionCaseACocher = { valeur: string; label: string };

const OptionCase = ({
  option,
  estCoché,
  onToggle,
}: {
  option: OptionCaseACocher;
  estCoché: boolean;
  onToggle: () => void;
}) => {
  const idCase = useId();
  return (
    <label className="flex items-center gap-2 cursor-pointer" htmlFor={idCase}>
      <Checkbox checked={estCoché} id={idCase} onCheckedChange={onToggle} />
      {option.label}
    </label>
  );
};

export function FiltreCasesACocher<TRow>({
  label,
  colonne,
  options,
}: {
  label: string;
  colonne: Column<TRow, unknown> | undefined;
  options: OptionCaseACocher[];
}) {
  const valeursCochées =
    (colonne?.getFilterValue() as string[] | undefined) ?? [];

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="font-semibold whitespace-nowrap">{label}</span>
      <div className="flex flex-wrap items-center gap-2">
        {options.map((option) => {
          const estCoché = valeursCochées.includes(option.valeur);
          return (
            <OptionCase
              estCoché={estCoché}
              key={option.valeur}
              onToggle={() =>
                colonne?.setFilterValue(
                  estCoché
                    ? valeursCochées.filter(
                        (valeur) => valeur !== option.valeur,
                      )
                    : [...valeursCochées, option.valeur],
                )
              }
              option={option}
            />
          );
        })}
      </div>
    </div>
  );
}
