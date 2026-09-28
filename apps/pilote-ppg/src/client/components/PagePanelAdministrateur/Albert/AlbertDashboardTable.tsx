import { DateTime } from "luxon";
import type { inferRouterOutputs } from "@trpc/server";
import { clsxm } from "@/utils/clsxm";
import { Table } from "@/components/shared/Table";
import { DataTableEmpty } from "@/components/shared/DataTable/Empty";
import { PaginationView } from "@/components/shared/DataTable/Pagination";
import type { appRouter } from "@/server/infrastructure/api/trpc/routes/routes";

type ListerOutput = inferRouterOutputs<
  typeof appRouter
>["albert"]["conversations"]["listerToutes"];
type LigneConversation = ListerOutput["items"][number];

export type TriDashboard = {
  champ: "createdAt" | "updatedAt";
  direction: "asc" | "desc";
};

type AlbertDashboardTableProps = {
  conversations: LigneConversation[];
  total: number;
  page: number;
  taillePage: number;
  tri: TriDashboard;
  enChargement: boolean;
  onPageChange: (page: number) => void;
  onTriChange: (tri: TriDashboard) => void;
  onLigneClick: (id: string) => void;
};

const formatterDateCourte = (date: Date) =>
  DateTime.fromJSDate(date).setZone("Europe/Paris").toFormat("dd/MM/yyyy");

const ColonneTri = ({
  champ,
  tri,
  label,
  onTriChange,
}: {
  champ: "createdAt" | "updatedAt";
  tri: TriDashboard;
  label: string;
  onTriChange: (tri: TriDashboard) => void;
}) => {
  const estActif = tri.champ === champ;
  return (
    <button
      className="!flex !items-center !gap-1 !text-left !font-semibold"
      onClick={() =>
        onTriChange({
          champ,
          direction: estActif && tri.direction === "desc" ? "asc" : "desc",
        })
      }
      type="button"
    >
      {label}
      {estActif && (tri.direction === "desc" ? " ↓" : " ↑")}
    </button>
  );
};

const Compteur = ({ valeur }: { valeur: number }) => (
  <span
    className={clsxm(
      "!text-sm !font-medium",
      valeur > 0 ? "!text-dsfr-grey-50" : "!text-dsfr-grey-625",
    )}
  >
    {valeur}
  </span>
);

export const AlbertDashboardTable = ({
  conversations,
  total,
  page,
  taillePage,
  tri,
  enChargement,
  onPageChange,
  onTriChange,
  onLigneClick,
}: AlbertDashboardTableProps) => {
  const debut = total === 0 ? 0 : (page - 1) * taillePage + 1;
  const fin = Math.min(page * taillePage, total);
  const nbPages = Math.max(1, Math.ceil(total / taillePage));

  if (!enChargement && conversations.length === 0) {
    return (
      <DataTableEmpty
        empty={{ title: "Aucune conversation pour ces filtres" }}
        hasActiveFilters={false}
        onResetFilters={() => {}}
      />
    );
  }

  const ariaSort = (champ: TriDashboard["champ"]) =>
    tri.champ === champ
      ? tri.direction === "desc"
        ? "descending"
        : "ascending"
      : undefined;

  return (
    <div>
      <Table.Root
        caption="Conversations Albert"
        captionHidden
        className="text-sm"
      >
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeaderCell className="px-4 py-2 md:px-4 md:py-2">
              Conversation
            </Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell className="px-4 py-2 md:px-4 md:py-2">
              Profil
            </Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell
              aria-sort={ariaSort("createdAt")}
              className="px-4 py-2 md:px-4 md:py-2"
            >
              <ColonneTri
                champ="createdAt"
                label="Créé le"
                onTriChange={onTriChange}
                tri={tri}
              />
            </Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell
              aria-sort={ariaSort("updatedAt")}
              className="px-4 py-2 md:px-4 md:py-2"
            >
              <ColonneTri
                champ="updatedAt"
                label="MAJ"
                onTriChange={onTriChange}
                tri={tri}
              />
            </Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell className="px-4 py-2 md:px-4 md:py-2 text-center">
              <span aria-hidden="true">👍</span>
              <span className="sr-only">Pouces levés</span>
            </Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell className="px-4 py-2 md:px-4 md:py-2 text-center">
              <span aria-hidden="true">👎</span>
              <span className="sr-only">Pouces baissés</span>
            </Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell className="px-4 py-2 md:px-4 md:py-2 text-center">
              <span aria-hidden="true">💬</span>
              <span className="sr-only">Commentaires</span>
            </Table.ColumnHeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {conversations.map((conversation) => (
            <Table.Row
              className={clsxm(
                "relative hover:bg-dsfr-grey-975-hover",
                enChargement && "!opacity-60",
              )}
              key={conversation.id}
            >
              <Table.RowHeaderCell className="!px-4 !py-3">
                <button
                  className="!font-medium !text-dsfr-grey-50 text-left after:absolute after:inset-0 after:content-['']"
                  onClick={() => onLigneClick(conversation.id)}
                  type="button"
                >
                  {conversation.titre || "Sans titre"}
                </button>
                {conversation.extraitPremierMessageUser && (
                  <div className="!text-xs !text-dsfr-mention-grey !mt-1 !line-clamp-1">
                    {conversation.extraitPremierMessageUser}
                  </div>
                )}
              </Table.RowHeaderCell>
              <Table.Cell className="!px-4 !py-3">
                <span className="!inline-block !px-2 !py-1 !text-xs !bg-dsfr-grey-1000 !rounded">
                  {conversation.utilisateur.profilNom}
                </span>
              </Table.Cell>
              <Table.Cell className="!px-4 !py-3 !whitespace-nowrap">
                {formatterDateCourte(conversation.createdAt)}
              </Table.Cell>
              <Table.Cell className="!px-4 !py-3 !whitespace-nowrap">
                {formatterDateCourte(conversation.updatedAt)}
              </Table.Cell>
              <Table.Cell className="!px-4 !py-3 !text-center">
                <Compteur valeur={conversation.nbPouce} />
              </Table.Cell>
              <Table.Cell className="!px-4 !py-3 !text-center">
                <Compteur valeur={conversation.nbPouceBas} />
              </Table.Cell>
              <Table.Cell className="!px-4 !py-3 !text-center">
                <Compteur valeur={conversation.nbCommentaire} />
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>

      <div className="!flex !items-center !justify-between !mt-4 !text-sm !text-dsfr-mention-grey">
        <span>
          {debut} – {fin} sur {total}
        </span>
        <PaginationView
          className="mt-0 mb-0"
          onPageChange={(pageIndex) => onPageChange(pageIndex + 1)}
          pageCount={nbPages}
          pageIndex={page - 1}
        />
      </div>
    </div>
  );
};
