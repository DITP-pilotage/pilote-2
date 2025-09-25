import {
  ColumnSort,
  createColumnHelper,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ChangeEvent, useCallback } from "react";
import {
  parseAsArrayOf,
  parseAsInteger,
  parseAsJson,
  parseAsString,
  useQueryState,
  useQueryStates,
} from "nuqs";
import { z } from "zod";
import { useSession } from "next-auth/react";
import { formaterDate } from "@/client/utils/date/date";
import { UtilisateurListeGestionContrat } from "@/server/app/contrats/UtilisateurListeGestionContrat";
import { ProfilEnum } from "@/server/app/enum/profil.enum";
import {
  PAGE_INDEX_DEFAUT,
  TAILLE_DEFAUT_PAGINATION_UTILISATEUR,
} from "@/client/constants/constantes";
import { Icone } from "@/components/_commons/Icone";
import { CloseCircleIcon } from "@/components/_commons/Icones/CloseCircleIcon";
import { SuccessIcon } from "@/components/_commons/Icones/SuccessIcon";

const reactTableColonnesHelper =
  createColumnHelper<UtilisateurListeGestionContrat>();
const colonnes = [
  reactTableColonnesHelper.accessor("email", {
    header: "Adresse électronique",
    cell: (props) => props.getValue(),
  }),
  reactTableColonnesHelper.accessor("nom", {
    header: "Nom",
    cell: (props) => props.getValue(),
  }),
  reactTableColonnesHelper.accessor("prénom", {
    header: "Prénom",
    cell: (props) => props.getValue(),
  }),
  reactTableColonnesHelper.accessor("profil", {
    header: "Profil",
    cell: (props) => props.getValue(),
  }),
  reactTableColonnesHelper.accessor("fonction", {
    header: "Fonction",
    cell: (props) => props.getValue(),
  }),
  reactTableColonnesHelper.accessor(
    (row) =>
      `${formaterDate(row.dateModification, "DD/MM/YYYY")} par ${row.auteurModification}`,
    {
      header: "Dernière modification",
      cell: (props) => props.getValue(),
      sortingFn: (a, b) => {
        const dateA = new Date(a.original.dateModification);
        const dateB = new Date(b.original.dateModification);

        if (dateA.getTime() > dateB.getTime()) {
          return 1;
        }

        if (dateA.getTime() < dateB.getTime()) {
          return -1;
        }

        return 0;
      },
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
          {props.getValue() === "desactive" ? (
            <Icone className="!text-error" icone={CloseCircleIcon} />
          ) : (
            <Icone className="!text-success" icone={SuccessIcon} />
          )}
        </div>
      );
    },
  }),
];

export const useTableauPageAdminUtilisateurs = (
  utilisateurs: UtilisateurListeGestionContrat[],
  nombreUtilisateur: number,
) => {
  const { data: session } = useSession();

  const estAutoriseAVoirLaColonneTerritoire = [
    ProfilEnum.DITP_ADMIN,
    ProfilEnum.DITP_PILOTAGE,
  ].includes(session!.profil);

  const [pagination, setPagination] = useQueryStates(
    {
      pageIndex: parseAsInteger.withDefault(PAGE_INDEX_DEFAUT),
      pageSize: parseAsInteger.withDefault(
        TAILLE_DEFAUT_PAGINATION_UTILISATEUR,
      ),
    },
    {
      history: "push",
      shallow: false,
    },
  );

  const ZodSchemaSorting = z.object({
    id: z
      .string()
      .regex(/email|nom|prénom|profil|fonction|Dernière modification/),
    desc: z.boolean(),
  });

  const [sorting, setSorting] = useQueryState(
    "sort",
    parseAsArrayOf<ColumnSort>(parseAsJson(ZodSchemaSorting.parse))
      .withDefault([
        {
          id: "Dernière modification",
          desc: true,
        },
      ])
      .withOptions({
        shallow: false,
        clearOnDefault: true,
        history: "push",
      }),
  );

  const [valeurDeLaRecherche, setValeurDeLaRecherche] = useQueryState(
    "q",
    parseAsString.withDefault("").withOptions({
      shallow: false,
      clearOnDefault: true,
      history: "push",
      throttleMs: 400,
    }),
  );

  const changementDeLaRechercheCallback = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setPagination({
        pageIndex: 1,
      });
      setValeurDeLaRecherche(event.target.value);
    },
    [setPagination, setValeurDeLaRecherche],
  );

  const tableau = useReactTable({
    data: utilisateurs,
    columns: colonnes,
    state: {
      pagination,
      sorting,
      columnVisibility: {
        territoire: estAutoriseAVoirLaColonneTerritoire,
      },
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: setPagination,
    pageCount: Math.ceil(nombreUtilisateur / pagination.pageSize),
    manualPagination: true,
  });

  return {
    nombreElementPage: nombreUtilisateur,
    tableau,
    valeurDeLaRecherche,
    changementDeLaRechercheCallback,
    setPagination,
  };
};
