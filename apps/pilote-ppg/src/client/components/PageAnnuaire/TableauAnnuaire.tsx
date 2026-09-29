import type { ReactNode } from "react";
import type { RowData } from "@tanstack/react-table";
import Loader from "@/components/_commons/Loader/Loader";
import { FiltresAnnuaire, type TableAnnuaire } from "./FiltresAnnuaire";

export function TableauAnnuaire<TData extends RowData>({
  table,
  isLoading,
  caption,
  placeholderRecherche,
  libelleResultats,
  libelleAucun,
  selecteurGroupement,
}: {
  table: TableAnnuaire<TData>;
  isLoading: boolean;
  caption: string;
  placeholderRecherche: string;
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
          <Loader />
        </div>
      ) : (
        <>
          <FiltresAnnuaire
            libelleResultats={libelleResultats}
            placeholderRecherche={placeholderRecherche}
            table={table}
          />
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
