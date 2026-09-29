import { DateTime } from "luxon";
import type { inferRouterOutputs } from "@trpc/server";
import {
  rowPaginationFeature,
  rowSortingFeature,
  tableFeatures,
} from "@tanstack/react-table";
import { useMemo } from "react";
import { clsxm } from "@/utils/clsxm";
import { createDataTableHook } from "@/components/shared/DataTable/createDataTableHook";
import type { appRouter } from "@/server/infrastructure/api/trpc/routes/routes";

type ListerOutput = inferRouterOutputs<
  typeof appRouter
>["albert"]["conversations"]["listerToutes"];
type LigneConversation = ListerOutput["items"][number];

export const CHAMPS_TRI_ALBERT = ["createdAt", "updatedAt"] as const;
export const TRI_ALBERT_PAR_DEFAUT = { id: "updatedAt", desc: true } as const;
export const TAILLE_PAGE_ALBERT = 25;

const LIBELLES_TRI_ALBERT: Record<(typeof CHAMPS_TRI_ALBERT)[number], string> =
  {
    createdAt: "Créé le",
    updatedAt: "MAJ",
  };

const albertDashboard = createDataTableHook(
  tableFeatures({ rowSortingFeature, rowPaginationFeature }),
);
const colonnesHelper = albertDashboard.createColumnHelper<LigneConversation>();

const formatterDateCourte = (date: Date) =>
  DateTime.fromJSDate(date).setZone("Europe/Paris").toFormat("dd/MM/yyyy");

const Compteur = ({ valeur }: { valeur: number }) => (
  <span
    className={clsxm(
      "text-sm font-medium",
      valeur > 0 ? "text-dsfr-grey-50" : "text-dsfr-grey-625",
    )}
  >
    {valeur}
  </span>
);

const colonneCompteur = (
  champ: "nbPouce" | "nbPouceBas" | "nbCommentaire",
  picto: string,
  label: string,
) =>
  colonnesHelper.accessor(champ, {
    header: () => (
      <>
        <span aria-hidden="true">{picto}</span>
        <span className="sr-only">{label}</span>
      </>
    ),
    enableSorting: false,
    cell: (cellContext) => <Compteur valeur={cellContext.getValue()} />,
    meta: {
      label,
      headerClassName: "text-center",
      cellClassName: "text-center",
    },
  });

type AlbertDashboardTableProps = {
  conversations: LigneConversation[];
  total: number;
  enChargement: boolean;
  onLigneClick: (id: string) => void;
};

export const AlbertDashboardTable = ({
  conversations,
  total,
  enChargement,
  onLigneClick,
}: AlbertDashboardTableProps) => {
  const colonnes = useMemo(
    () =>
      colonnesHelper.columns([
        colonnesHelper.accessor("titre", {
          header: "Conversation",
          enableSorting: false,
          cell: (cellContext) => (
            <>
              <button
                className="font-medium text-dsfr-grey-50 text-left after:absolute after:inset-0 after:content-['']"
                onClick={() => onLigneClick(cellContext.row.original.id)}
                type="button"
              >
                {cellContext.getValue() || "Sans titre"}
              </button>
              {cellContext.row.original.extraitPremierMessageUser && (
                <div className="text-xs text-dsfr-mention-grey mt-1 line-clamp-1">
                  {cellContext.row.original.extraitPremierMessageUser}
                </div>
              )}
            </>
          ),
        }),
        colonnesHelper.accessor((ligne) => ligne.utilisateur.profilNom, {
          id: "profil",
          header: "Profil",
          enableSorting: false,
          cell: (cellContext) => (
            <span className="inline-block px-2 py-1 text-xs bg-dsfr-grey-1000 rounded">
              {cellContext.getValue()}
            </span>
          ),
        }),
        colonnesHelper.accessor("createdAt", {
          header: LIBELLES_TRI_ALBERT.createdAt,
          cell: (cellContext) => formatterDateCourte(cellContext.getValue()),
          meta: { cellClassName: "whitespace-nowrap" },
        }),
        colonnesHelper.accessor("updatedAt", {
          header: LIBELLES_TRI_ALBERT.updatedAt,
          cell: (cellContext) => formatterDateCourte(cellContext.getValue()),
          meta: { cellClassName: "whitespace-nowrap" },
        }),
        colonneCompteur("nbPouce", "👍", "Pouces levés"),
        colonneCompteur("nbPouceBas", "👎", "Pouces baissés"),
        colonneCompteur("nbCommentaire", "💬", "Commentaires"),
      ]),
    [onLigneClick],
  );

  const table = albertDashboard.useDataTable({
    data: conversations,
    columns: colonnes,
    rowHeader: "titre",
    manualPagination: true,
    manualSorting: true,
    rowCount: total,
    urlState: {
      sorting: {
        default: [TRI_ALBERT_PAR_DEFAUT],
        labels: LIBELLES_TRI_ALBERT,
      },
      pagination: { pageSize: TAILLE_PAGE_ALBERT },
      shallow: false,
      history: "push",
    },
  });

  const { pageIndex, pageSize } = table.store.state.pagination;
  const debut = total === 0 ? 0 : pageIndex * pageSize + 1;
  const fin = Math.min((pageIndex + 1) * pageSize, total);

  return (
    <div>
      <table.Root
        caption="Conversations Albert"
        captionHidden
        className="text-sm"
        empty={
          enChargement
            ? undefined
            : { title: "Aucune conversation pour ces filtres" }
        }
      >
        <table.Header cellClassName="px-4 py-2 md:px-4 md:py-2" />
        <table.Body
          cellClassName="px-4 py-3 md:px-4 md:py-3"
          rowClassName={clsxm(
            "relative hover:bg-dsfr-grey-975-hover",
            enChargement && "opacity-60",
          )}
        />
      </table.Root>
      {total > 0 && (
        <div className="flex items-center justify-between mt-4 text-sm text-dsfr-mention-grey">
          <span>
            {debut} – {fin} sur {total}
          </span>
          <table.Pagination className="mt-0 mb-0" />
        </div>
      )}
    </div>
  );
};
