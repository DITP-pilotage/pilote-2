import { type inferParserType, useQueryStates } from "nuqs";
import {
  adminUtilisateursFilterParsers,
  adminUtilisateursSearchParams,
} from "@/client/searchParams/adminUtilisateursSearchParams";

type FilterValues = inferParserType<typeof adminUtilisateursFilterParsers>;

export type AdminUtilisateursFilter = keyof FilterValues;

const sameValues = (left: readonly string[], right: readonly string[]) =>
  left.length === right.length && left.every((value) => right.includes(value));

export const useAdminUtilisateursSearchParams = () => {
  const [params, setParams] = useQueryStates(adminUtilisateursSearchParams, {
    history: "push",
    clearOnDefault: true,
  });

  const setFilter = <K extends AdminUtilisateursFilter>(
    filter: K,
    values: FilterValues[K],
  ) => {
    const current: FilterValues[K] = params[filter];
    if (sameValues(current, values)) return;
    void setParams({ [filter]: values, page: null });
  };

  const resetSidebarFilters = () =>
    void setParams({
      territoires: null,
      perimetresMinisteriels: null,
      chantiers: null,
      profils: null,
      page: null,
    });

  return { params, setFilter, resetSidebarFilters };
};
