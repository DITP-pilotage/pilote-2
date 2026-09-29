import type { ReactNode } from "react";
import type { AnyColumn } from "./types";

const ARROWS = { asc: "↑", desc: "↓" } as const;

export function ColumnSortButton({
  column,
  children,
}: {
  column: AnyColumn;
  children: ReactNode;
}) {
  const sorted = column.getIsSorted();
  const nextDesc = sorted
    ? sorted === "asc"
    : column.getFirstSortDir() === "desc";

  return (
    <button
      className="inline-flex cursor-pointer items-center gap-1 m-0 p-0 text-left font-bold hover:bg-transparent"
      onClick={() => column.toggleSorting(nextDesc)}
      type="button"
    >
      {children}
      <span aria-hidden="true" className="inline-block w-3 text-primary">
        {sorted ? ARROWS[sorted] : null}
      </span>
      <span className="sr-only">
        {`, trier par ordre ${nextDesc ? "décroissant" : "croissant"}`}
      </span>
    </button>
  );
}
