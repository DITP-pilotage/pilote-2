import type { SortingState } from "@tanstack/react-table";
import { createParser, parseAsIndex } from "nuqs/server";

const DIRECTIONS = { asc: false, desc: true } as const;

export const parseAsSorting = createParser<SortingState>({
  parse: (value) => {
    const sorting = value.split(",").map((part) => {
      const separator = part.lastIndexOf(".");
      const direction = part.slice(separator + 1);
      if (separator <= 0 || !(direction in DIRECTIONS)) return null;
      return {
        id: part.slice(0, separator),
        desc: DIRECTIONS[direction as keyof typeof DIRECTIONS],
      };
    });
    return sorting.length > 0 && sorting.every((sort) => sort != null)
      ? (sorting as SortingState)
      : null;
  },
  serialize: (sorting) =>
    sorting.map((sort) => `${sort.id}.${sort.desc ? "desc" : "asc"}`).join(","),
  eq: (left, right) =>
    left.length === right.length &&
    left.every(
      (sort, index) =>
        sort.id === right[index].id && sort.desc === right[index].desc,
    ),
});

export const parseAsTablePage = parseAsIndex.withDefault(0);
