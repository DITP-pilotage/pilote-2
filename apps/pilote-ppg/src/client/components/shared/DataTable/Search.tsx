import { type ComponentProps, useEffect, useRef, useState } from "react";
import { SearchInput } from "@/components/shared/SearchInput";
import type { AnyTable } from "./types";

export type DataTableSearchProps = Omit<
  ComponentProps<typeof SearchInput>,
  "value" | "defaultValue" | "onChange"
> & {
  debounceMs?: number;
};

// La valeur issue de l'URL revient en retard après une navigation serveur : elle n'écrase pas la saisie en cours.
export function DataTableSearch({
  table,
  debounceMs = 0,
  ...props
}: DataTableSearchProps & { table: AnyTable }) {
  const valeurTable: string = table.store.state.globalFilter ?? "";
  const [valeur, setValeur] = useState(valeurTable);
  const derniereValeurEnvoyee = useRef(valeurTable);
  const envoiDiffere = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (valeurTable === derniereValeurEnvoyee.current) return;
    clearTimeout(envoiDiffere.current);
    derniereValeurEnvoyee.current = valeurTable;
    setValeur(valeurTable);
  }, [valeurTable]);

  useEffect(() => () => clearTimeout(envoiDiffere.current), []);

  const envoyer = (suivante: string) => {
    derniereValeurEnvoyee.current = suivante;
    table.setGlobalFilter(suivante);
  };

  return (
    <SearchInput
      {...props}
      onChange={(event) => {
        const suivante = event.target.value;
        setValeur(suivante);
        clearTimeout(envoiDiffere.current);
        if (debounceMs > 0) {
          envoiDiffere.current = setTimeout(
            () => envoyer(suivante),
            debounceMs,
          );
        } else {
          envoyer(suivante);
        }
      }}
      value={valeur}
    />
  );
}
