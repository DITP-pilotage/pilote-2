import type { ReactNode } from "react";
import type { RowData } from "@tanstack/react-table";
import { PageLoader } from "@/components/shared/PageLoader";
import type { TableAdmin } from "./tableauAdminDataTable";

export type LibellesTableauAdmin = {
  aucun: string;
  aucunResultat: string;
  invitationCreation?: string;
  iconeVide?: string;
};

export function TableauAdmin<TRow extends RowData>({
  table,
  isLoading,
  caption,
  libelles,
}: {
  table: TableAdmin<TRow>;
  isLoading: boolean;
  caption: string;
  libelles: LibellesTableauAdmin;
}) {
  const recherche = table.store.state.globalFilter ?? "";
  const descriptionSansResultat: ReactNode = recherche ? (
    <>
      {libelles.aucunResultat} «&nbsp;{recherche}&nbsp;».
    </>
  ) : (
    "Aucun élément ne correspond aux filtres sélectionnés."
  );

  return (
    <div className="bg-white rounded-lg shadow-sm ring-1 ring-dsfr-grey-925 overflow-hidden">
      {isLoading ? (
        <div className="relative py-20">
          <PageLoader />
        </div>
      ) : (
        <>
          <table.Filters />
          <table.Root
            caption={caption}
            captionHidden
            empty={{
              noData: {
                title: libelles.aucun,
                description: libelles.iconeVide ? (
                  <>
                    <span aria-hidden="true">{libelles.iconeVide}</span>{" "}
                    {libelles.invitationCreation}
                  </>
                ) : (
                  libelles.invitationCreation
                ),
              },
              noResults: {
                title: "Aucun résultat",
                description: descriptionSansResultat,
              },
            }}
          >
            <table.Header />
            <table.Body />
          </table.Root>
          <table.Pagination
            className="my-0 px-6 py-3"
            pageSizeOptions={[10, 20, 50]}
          />
        </>
      )}
    </div>
  );
}
