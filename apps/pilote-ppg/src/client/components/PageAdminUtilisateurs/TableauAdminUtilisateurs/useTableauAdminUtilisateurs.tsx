import {
  columnFilteringFeature,
  globalFilteringFeature,
  rowPaginationFeature,
  rowSortingFeature,
  tableFeatures,
} from "@tanstack/react-table";
import { ChangeEvent, useCallback } from "react";
import { useSession } from "next-auth/react";
import { formaterDate } from "@/client/utils/date/date";
import { UtilisateurListeGestionContrat } from "@/server/app/contrats/UtilisateurListeGestionContrat";
import { ProfilEnum } from "@/server/app/enum/profil.enum";
import { TAILLE_DEFAUT_PAGINATION_UTILISATEUR } from "@/client/constants/constantes";
import { createDataTableHook } from "@/components/shared/DataTable/createDataTableHook";
import { Icone } from "@/components/_commons/Icone";
import { CloseCircleIcon } from "@/components/_commons/Icones/CloseCircleIcon";
import { SuccessIcon } from "@/components/_commons/Icones/SuccessIcon";

const featuresTableauAdminUtilisateurs = tableFeatures({
  columnFilteringFeature,
  globalFilteringFeature,
  rowSortingFeature,
  rowPaginationFeature,
});

const adminUtilisateurs = createDataTableHook(featuresTableauAdminUtilisateurs);
const reactTableColonnesHelper =
  adminUtilisateurs.createColumnHelper<UtilisateurListeGestionContrat>();
const colonnes = reactTableColonnesHelper.columns([
  reactTableColonnesHelper.accessor("email", {
    header: "Adresse électronique",
    enableSorting: true,
    cell: (props) => props.getValue(),
  }),
  reactTableColonnesHelper.accessor("nom", {
    header: "Nom",
    enableSorting: true,
    cell: (props) => props.getValue(),
  }),
  reactTableColonnesHelper.accessor("prénom", {
    header: "Prénom",
    enableSorting: true,
    cell: (props) => props.getValue(),
  }),
  reactTableColonnesHelper.accessor("profil", {
    header: "Profil",
    enableSorting: true,
    cell: (props) => props.getValue(),
  }),
  reactTableColonnesHelper.accessor("fonction", {
    header: "Fonction",
    enableSorting: true,
    cell: (props) => props.getValue(),
  }),
  reactTableColonnesHelper.accessor(
    (row) =>
      `${formaterDate(row.dateModification, "DD/MM/YYYY")} par ${row.auteurModification}`,
    {
      id: "Dernière modification",
      header: "Dernière modification",
      enableSorting: true,
      cell: (props) => props.getValue(),
    },
  ),
  reactTableColonnesHelper.accessor(
    (row) => row.listeNomsTerritoires.join(", "),
    {
      id: "territoire",
      header: "Territoire",
      cell: (props) => props.getValue(),
    },
  ),
  reactTableColonnesHelper.accessor("statut", {
    header: "Actif",
    cell: (props) => {
      return (
        <div className="flex justify-center">
          <span className="sr-only">
            {props.getValue() === "desactive" ? "Désactivé" : "Actif"}
          </span>
          {props.getValue() === "desactive" ? (
            <Icone className="text-error" icone={CloseCircleIcon} />
          ) : (
            <Icone className="text-success" icone={SuccessIcon} />
          )}
        </div>
      );
    },
  }),
]);

export const useTableauPageAdminUtilisateurs = (
  utilisateurs: UtilisateurListeGestionContrat[],
  nombreUtilisateur: number,
) => {
  const { data: session } = useSession();

  const estAutoriseAVoirLaColonneTerritoire = [
    ProfilEnum.DITP_ADMIN,
    ProfilEnum.DITP_PILOTAGE,
  ].includes(session!.profil);

  const tableau = adminUtilisateurs.useDataTable({
    data: utilisateurs,
    columns: colonnes,
    rowHeader: "email",
    getRowHref: (row) => `/admin/utilisateur/${row.original.id}`,
    manualPagination: true,
    manualSorting: true,
    rowCount: nombreUtilisateur,
    state: {
      columnVisibility: { territoire: estAutoriseAVoirLaColonneTerritoire },
    },
    urlState: {
      sorting: { default: [{ id: "Dernière modification", desc: true }] },
      pagination: { pageSize: TAILLE_DEFAUT_PAGINATION_UTILISATEUR },
      globalFilter: true,
      shallow: false,
      history: "push",
      throttleMs: 400,
    },
  });

  const changementDeLaRechercheCallback = useCallback(
    (event: ChangeEvent<HTMLInputElement>) =>
      tableau.setGlobalFilter(event.target.value),
    [tableau],
  );

  return {
    tableau,
    changementDeLaRechercheCallback,
    valeurDeLaRecherche: tableau.store.state.globalFilter ?? "",
  };
};
