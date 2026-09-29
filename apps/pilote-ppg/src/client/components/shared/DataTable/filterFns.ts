import {
  constructFilterFn,
  type RowData,
  type TableFeatures,
} from "@tanstack/react-table";

const toArray = (value: unknown): unknown[] =>
  Array.isArray(value) ? value : value == null ? [] : [value];

export const filterFnOneOf = constructFilterFn({
  filter: (valeur, filterValue) => {
    const selection = toArray(filterValue);
    return selection.length === 0 || selection.includes(valeur);
  },
  autoRemove: (filterValue) => toArray(filterValue).length === 0,
});

const normalize = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

export const createSearchFilterFn = <TData extends RowData>(
  search: (row: TData) => string[],
) =>
  constructFilterFn<TableFeatures, TData>({
    filter: (_valeur, filterValue, row) => {
      const recherche = normalize(String(filterValue ?? ""));
      if (recherche === "") return true;
      return search(row.original).some((champ) =>
        normalize(champ ?? "").includes(recherche),
      );
    },
  });
