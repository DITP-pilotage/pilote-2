import { Icone } from "@/components/_commons/Icone";
import { Button } from "@/components/shared/Button";
import { InformationPleineIcon } from "@/components/_commons/Icones/InformationPleineIcon";
import type { AnyTable, EmptyConfig, EmptyMessage } from "./types";

const isSplitConfig = (
  empty: EmptyConfig,
): empty is { noData: EmptyMessage; noResults: EmptyMessage } =>
  "noData" in empty;

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
    <div className="bg-dsfr-info-950 py-4 text-dsfr-flat-info" role="status">
      <div className="flex flex-col items-start gap-2 px-4 md:px-6">
        <p className="!mb-0 flex items-center gap-1 font-bold">
          <Icone
            className="w-6 h-6 shrink-0 text-current"
            icone={InformationPleineIcon}
          />
          {message.title}
        </p>
        {message.description}
        {message.action}
        {showNoResults && (
          <Button onClick={onResetFilters} size="sm" variant="secondary">
            Réinitialiser les filtres
          </Button>
        )}
      </div>
    </div>
  );
}

export const isTableEmpty = (table: AnyTable) =>
  table.getRowModel().rows.length === 0;
