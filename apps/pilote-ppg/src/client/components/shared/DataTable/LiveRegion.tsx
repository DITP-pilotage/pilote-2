import { useEffect, useRef, useState } from "react";
import { getColumnLabel, hasFeature } from "./features";
import type { AnyTable } from "./types";

const plural = (count: number) =>
  count === 0 ? "Aucun résultat" : `${count} résultat${count > 1 ? "s" : ""}`;

function describeSorting(table: AnyTable) {
  const [first] = table.store.state.sorting ?? [];
  if (!first) return "Tri retiré";
  const column = table.getColumn(first.id);
  const label = column ? getColumnLabel(column) : first.id;
  return `Trié par ${label}, ordre ${first.desc ? "décroissant" : "croissant"}`;
}

const resultCount = (table: AnyTable) =>
  hasFeature(table, "rowPaginationFeature")
    ? table.getRowCount()
    : table.getRowModel().rows.length;

export function DataTableLiveRegion({ table }: { table: AnyTable }) {
  const state = table.store.state;
  const sortingKey = JSON.stringify(state.sorting ?? null);
  const pageIndex = state.pagination?.pageIndex ?? null;
  const filtersKey = JSON.stringify([
    state.columnFilters ?? null,
    state.globalFilter ?? null,
  ]);
  const count = resultCount(table);

  const [message, setMessage] = useState("");
  const previous = useRef({ sortingKey, pageIndex, filtersKey, count });

  useEffect(() => {
    const before = previous.current;
    previous.current = { sortingKey, pageIndex, filtersKey, count };
    if (before.sortingKey !== sortingKey) {
      setMessage(describeSorting(table));
    } else if (before.filtersKey !== filtersKey || before.count !== count) {
      setMessage(plural(count));
    } else if (before.pageIndex !== pageIndex && pageIndex != null) {
      setMessage(`Page ${pageIndex + 1} sur ${table.getPageCount()}`);
    }
  }, [table, sortingKey, pageIndex, filtersKey, count]);

  return (
    <div aria-atomic="true" aria-live="polite" className="sr-only">
      {message}
    </div>
  );
}
