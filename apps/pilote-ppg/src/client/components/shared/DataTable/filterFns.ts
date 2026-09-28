import type { FilterFn } from "@tanstack/react-table";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyFilterFn = FilterFn<any, any>;

const toArray = (value: unknown): unknown[] =>
  Array.isArray(value) ? value : value == null ? [] : [value];

export const filterFnOneOf: AnyFilterFn = (row, columnId, filterValue) => {
  const selection = toArray(filterValue);
  if (selection.length === 0) return true;
  return selection.includes(row.getValue(columnId));
};
filterFnOneOf.autoRemove = (filterValue) => toArray(filterValue).length === 0;

const normalize = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

export const createSearchFilterFn =
  <TData>(search: (row: TData) => string[]): AnyFilterFn =>
  (row, _columnId, filterValue) => {
    const recherche = normalize(String(filterValue ?? ""));
    if (recherche === "") return true;
    return search(row.original as TData).some((champ) =>
      normalize(champ ?? "").includes(recherche),
    );
  };
