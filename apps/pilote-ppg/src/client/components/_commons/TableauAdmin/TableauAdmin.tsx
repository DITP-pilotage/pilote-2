import type { ReactNode } from "react";
import Loader from "@/components/_commons/Loader/Loader";
import type { DataTableBodyProps } from "@/components/shared/DataTable/Body";
import type { DataTableFiltersProps } from "@/components/shared/DataTable/Filters";
import type { DataTableHeaderProps } from "@/components/shared/DataTable/Header";
import type { DataTablePaginationProps } from "@/components/shared/DataTable/Pagination";
import type { DataTableRootProps } from "@/components/shared/DataTable/Root";

export type LibellesTableauAdmin = {
  aucun: string;
  aucunResultat: string;
  invitationCreation?: string;
  iconeVide?: string;
};

type TableauAdminTable = {
  Filters: (props: DataTableFiltersProps) => ReactNode;
  Root: (props: DataTableRootProps) => ReactNode;
  Header: (props: DataTableHeaderProps) => ReactNode;
  Body: (props: DataTableBodyProps) => ReactNode;
  Pagination: (props: DataTablePaginationProps) => ReactNode;
  store: { state: { globalFilter?: string } };
};

export function TableauAdmin({
  table,
  isLoading,
  caption,
  libelles,
}: {
  table: TableauAdminTable;
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
          <Loader />
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
