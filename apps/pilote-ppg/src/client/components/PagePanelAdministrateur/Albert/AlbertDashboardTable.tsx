import type { inferRouterOutputs } from "@trpc/server";
import { clsxm } from "@/utils/clsxm";
import type { appRouter } from "@/server/infrastructure/api/trpc/routes/routes";

type ListerOutput = inferRouterOutputs<
  typeof appRouter
>["albert"]["admin"]["listerConversations"];
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
  new Intl.DateTimeFormat("fr-FR", { dateStyle: "short" }).format(date);

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

const Pastille = ({ actif }: { actif: boolean }) =>
  actif ? (
    <span className="!text-green-600">✓</span>
  ) : (
    <span className="!text-gray-300">—</span>
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
      <div className="!p-10 !text-center !text-gray-500 !border !border-gray-200 !rounded-md">
        Aucune conversation pour ces filtres
      </div>
    );
  }

  return (
    <div>
      <div className="!overflow-x-auto !border !border-gray-200 !rounded-md">
        <table className="!w-full !text-sm">
          <thead className="!bg-gray-50">
            <tr>
              <th className="!text-left !px-4 !py-2">Conversation</th>
              <th className="!text-left !px-4 !py-2">Utilisateur</th>
              <th className="!text-left !px-4 !py-2">Profil</th>
              <th className="!text-left !px-4 !py-2">
                <ColonneTri
                  champ="createdAt"
                  label="Créé le"
                  onTriChange={onTriChange}
                  tri={tri}
                />
              </th>
              <th className="!text-left !px-4 !py-2">
                <ColonneTri
                  champ="updatedAt"
                  label="MAJ"
                  onTriChange={onTriChange}
                  tri={tri}
                />
              </th>
              <th className="!text-center !px-4 !py-2">👍</th>
              <th className="!text-center !px-4 !py-2">👎</th>
              <th className="!text-center !px-4 !py-2">💬</th>
            </tr>
          </thead>
          <tbody>
            {conversations.map((conversation) => (
              <tr
                className={clsxm(
                  "!border-t !border-gray-200 !cursor-pointer hover:!bg-gray-50",
                  enChargement && "!opacity-60",
                )}
                key={conversation.id}
                onClick={() => onLigneClick(conversation.id)}
              >
                <td className="!px-4 !py-3">
                  <div className="!font-medium !text-gray-900">
                    {conversation.titre || "Sans titre"}
                  </div>
                  {conversation.extraitPremierMessageUser && (
                    <div className="!text-xs !text-gray-500 !mt-1 !line-clamp-1">
                      {conversation.extraitPremierMessageUser}
                    </div>
                  )}
                </td>
                <td className="!px-4 !py-3">
                  <div>
                    {conversation.utilisateur.prenom}{" "}
                    {conversation.utilisateur.nom}
                  </div>
                  <div className="!text-xs !text-gray-500">
                    {conversation.utilisateur.email}
                  </div>
                </td>
                <td className="!px-4 !py-3">
                  <span className="!inline-block !px-2 !py-1 !text-xs !bg-gray-100 !rounded">
                    {conversation.utilisateur.profilNom}
                  </span>
                </td>
                <td className="!px-4 !py-3 !whitespace-nowrap">
                  {formatterDateCourte(conversation.createdAt)}
                </td>
                <td className="!px-4 !py-3 !whitespace-nowrap">
                  {formatterDateCourte(conversation.updatedAt)}
                </td>
                <td className="!px-4 !py-3 !text-center">
                  <Pastille actif={conversation.aPouce} />
                </td>
                <td className="!px-4 !py-3 !text-center">
                  <Pastille actif={conversation.aPouceBas} />
                </td>
                <td className="!px-4 !py-3 !text-center">
                  <Pastille actif={conversation.aCommentaire} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="!flex !items-center !justify-between !mt-4 !text-sm !text-gray-600">
        <span>
          {debut} – {fin} sur {total}
        </span>
        <div className="!flex !gap-2">
          <button
            className="!px-3 !py-1 !border !border-gray-300 !rounded-md disabled:!opacity-50"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            type="button"
          >
            Précédent
          </button>
          <span>
            Page {page} / {nbPages}
          </span>
          <button
            className="!px-3 !py-1 !border !border-gray-300 !rounded-md disabled:!opacity-50"
            disabled={page >= nbPages}
            onClick={() => onPageChange(page + 1)}
            type="button"
          >
            Suivant
          </button>
        </div>
      </div>
    </div>
  );
};
