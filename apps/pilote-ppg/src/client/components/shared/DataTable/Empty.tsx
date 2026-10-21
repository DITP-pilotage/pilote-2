import { Button } from "@/components/shared/Button";
import type { AnyTable, EmptyConfig, EmptyMessage } from "./types";

const SEARCH_PICTOGRAM = "/dsfr/artwork/pictograms/digital/search.svg";

const isSplitConfig = (
  empty: EmptyConfig,
): empty is { noData: EmptyMessage; noResults: EmptyMessage } =>
  "noData" in empty;

// Pictogramme DSFR (artwork) coloré par ses trois calques, comme sur les pages d'erreur.
const SearchPictogram = () => (
  <svg
    aria-hidden="true"
    className="h-20 w-20 shrink-0"
    viewBox="0 0 80 80"
    xmlns="http://www.w3.org/2000/svg"
  >
    <use
      className="fill-dsfr-blue-france-950"
      href={`${SEARCH_PICTOGRAM}#artwork-decorative`}
    />
    <use
      className="fill-dsfr-red-marianne-main-472"
      href={`${SEARCH_PICTOGRAM}#artwork-minor`}
    />
    <use
      className="fill-dsfr-blue-france-sun-113"
      href={`${SEARCH_PICTOGRAM}#artwork-major`}
    />
  </svg>
);

export function DataTableEmpty({
  empty,
  hasActiveFilters,
  onResetFilters,
}: {
  empty: EmptyConfig;
  hasActiveFilters: boolean;
  onResetFilters: () => void;
}) {
  const showNoResults = isSplitConfig(empty) && hasActiveFilters;
  const message = isSplitConfig(empty)
    ? showNoResults
      ? empty.noResults
      : empty.noData
    : empty;

  return (
    <div
      className="flex flex-col items-center gap-3 bg-white px-4 py-12 text-center md:px-6"
      role="status"
    >
      <SearchPictogram />
      <p className="mb-0 text-lg font-bold leading-7 text-dsfr-grey-50">
        {message.title}
      </p>
      {message.description ? (
        <div className="max-w-prose text-dsfr-mention-grey [&_p]:mb-0">
          {message.description}
        </div>
      ) : null}
      {message.action || showNoResults ? (
        <div className="mt-2 flex flex-wrap justify-center gap-2">
          {message.action}
          {showNoResults && (
            <Button onClick={onResetFilters} size="sm" variant="secondary">
              Réinitialiser les filtres
            </Button>
          )}
        </div>
      ) : null}
    </div>
  );
}

export const isTableEmpty = (table: AnyTable) =>
  table.getRowModel().rows.length === 0;
