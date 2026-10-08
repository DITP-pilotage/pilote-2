import type { ReactNode } from "react";
import type { RowData } from "@tanstack/react-table";
import { PageLoader } from "@/components/shared/PageLoader";
import type {
  AppFeatures,
  DataTable,
} from "@/components/shared/DataTable/createDataTableHook";
import type { featuresAnnuaire } from "./featuresAnnuaire";

export type TableAnnuaire<TData extends RowData> = DataTable<
  AppFeatures<typeof featuresAnnuaire>,
  TData
>;

export function TableauAnnuaire<TData extends RowData>({
  table,
  isLoading,
  caption,
  libelleResultats,
  libelleAucun,
  selecteurGroupement,
}: {
  table: TableAnnuaire<TData>;
  isLoading: boolean;
  caption: string;
  libelleResultats: string;
  libelleAucun: string;
  selecteurGroupement: ReactNode;
}) {
  return (
    <section
      aria-label={caption}
      className="overflow-hidden rounded-xl border border-dsfr-grey-925 bg-white"
    >
      {isLoading ? (
        <div className="relative py-20">
          <PageLoader />
        </div>
      ) : (
        <>
          <table.Filters layout="inline" resultats={libelleResultats} />
          {selecteurGroupement}
          <table.Root
            caption={caption}
            captionHidden
            className="table-fixed"
            empty={{
              noData: { title: libelleAucun },
              noResults: {
                title: "Aucun résultat",
                description:
                  "Modifiez la recherche ou réinitialisez les filtres.",
              },
            }}
          >
            <table.Header
              cellClassName="py-3 md:py-3 text-xs uppercase tracking-wider text-dsfr-mention-grey border-b border-dsfr-grey-925 [&_button]:uppercase [&_button]:tracking-wider [&_button]:text-dsfr-grey-50"
              className="bg-white"
            />
            <table.Body cellClassName="align-top" />
          </table.Root>
          <table.Pagination
            className="my-0 border-t border-dsfr-grey-925 px-6 py-3"
            pageSizeOptions={[10, 20, 50]}
          />
        </>
      )}
    </section>
  );
}
