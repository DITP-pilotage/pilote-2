import { type ComponentProps, useEffect, useRef, useState } from "react";
import { SearchInput } from "@/components/shared/SearchInput";
import { getDataTableConfig } from "./config";
import type { AnyTable } from "./types";

export type DataTableSearchProps = Omit<
  ComponentProps<typeof SearchInput>,
  "value" | "defaultValue" | "onChange"
> & {
  debounceMs?: number;
};

const SERVER_SEARCH_DEBOUNCE_MS = 300;

// La valeur issue de l'URL revient en retard après une navigation serveur : elle n'écrase pas la saisie en cours.
export function DataTableSearch({
  table,
  debounceMs,
  ...props
}: DataTableSearchProps & { table: AnyTable }) {
  const delayMs =
    debounceMs ??
    (getDataTableConfig(table).reloadsOnUrlChange
      ? SERVER_SEARCH_DEBOUNCE_MS
      : 0);
  const tableValue: string = table.store.state.globalFilter ?? "";
  const [value, setValue] = useState(tableValue);
  const lastSentValue = useRef(tableValue);
  const pendingSend = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (tableValue === lastSentValue.current) return;
    clearTimeout(pendingSend.current);
    lastSentValue.current = tableValue;
    setValue(tableValue);
  }, [tableValue]);

  useEffect(() => () => clearTimeout(pendingSend.current), []);

  const send = (nextValue: string) => {
    lastSentValue.current = nextValue;
    table.setGlobalFilter(nextValue);
  };

  return (
    <SearchInput
      {...props}
      onChange={(event) => {
        const nextValue = event.target.value;
        setValue(nextValue);
        clearTimeout(pendingSend.current);
        if (delayMs > 0) {
          pendingSend.current = setTimeout(() => send(nextValue), delayMs);
        } else {
          send(nextValue);
        }
      }}
      value={value}
    />
  );
}
