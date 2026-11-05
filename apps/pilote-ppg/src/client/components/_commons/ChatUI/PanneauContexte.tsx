import { useChat } from "@ai-sdk/react";
import { useMemo } from "react";
import { récupérerDétailsSurUnTerritoire } from "@/client/constants/territoires";
import { Icone } from "@/components/_commons/Icone";
import { ArrowLeftSLineIcon } from "@/components/_commons/Icones/ArrowLeftSLineIcon";
import { CloseLineIcon } from "@/components/_commons/Icones/CloseLineIcon";
import { MapPin2Icon } from "@/components/_commons/Icones/MapPin2Icon";
import type { CurrentConversation } from "@/components/_commons/ChatUI/AlbertConversationProvider";
import { ContexteErrorBoundary } from "@/components/_commons/ChatUI/ContexteErrorBoundary";
import {
  donneesDuContexte,
  type EntreeContexte,
} from "@/components/_commons/ChatUI/donneesDuContexte";
import type { PiloteUIMessage } from "@/server/albert/PiloteUIMessage";
import { clsxm } from "@/utils/clsxm";

const lireTerritoire = (code: string) =>
  récupérerDétailsSurUnTerritoire(code)?.nomAffiché ?? null;

const TITRE_SECTION =
  "m-0 text-[11px] font-bold uppercase leading-4 tracking-wide text-dsfr-grey-200";

const DonneeIllisible = () => (
  <div className="border border-dashed border-dsfr-grey-900 px-3.5 py-2.5 text-xs text-dsfr-mention-grey">
    Donnée chargée dans un format que ce panneau ne sait pas afficher.
  </div>
);

const CarteDonnee = ({ entree }: { entree: EntreeContexte }) => (
  <div className="flex flex-col gap-1.5 border border-dsfr-grey-900 bg-white px-3.5 py-3">
    <span className="text-sm font-bold text-dsfr-grey-50">{entree.titre}</span>
    <span className="text-xs leading-[18px] text-dsfr-mention-grey">
      {entree.resume}
    </span>
    {entree.absent ? (
      <span className="text-xs leading-[18px] text-dsfr-grey-200">
        {entree.absent}
      </span>
    ) : null}
    {entree.tableau && entree.tableau.lignes.length > 0 ? (
      <details className="text-xs">
        <summary className="cursor-pointer font-medium text-primary">
          Voir les données
        </summary>
        <div className="mt-2 max-h-64 overflow-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="text-left text-dsfr-mention-grey">
                {entree.tableau.colonnes.map((colonne, index) => (
                  <th
                    className={clsxm(
                      "border-b border-dsfr-grey-900 py-1 font-medium",
                      index > 0 && "text-right",
                    )}
                    key={colonne}
                  >
                    {colonne}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {entree.tableau.lignes.map((ligne, indexLigne) => (
                <tr key={indexLigne}>
                  {ligne.map((cellule, index) => (
                    <td
                      className={clsxm(
                        "border-b border-dsfr-grey-925 py-1 pr-1",
                        index > 0 && "text-right",
                      )}
                      key={index}
                    >
                      {cellule}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    ) : null}
  </div>
);

const ContexteDeSession = ({
  conversation,
}: {
  conversation: CurrentConversation;
}) => {
  const contexte = conversation.agentContext;
  if (!contexte) {
    return (
      <p className="m-0 text-xs leading-[18px] text-dsfr-mention-grey">
        Aucun territoire courant : sans précision dans votre question,
        l&apos;assistant vous demandera de quel territoire il s&apos;agit.
      </p>
    );
  }

  const lignes = [
    ...(contexte.chantierId
      ? [
          {
            libelle: "Chantier courant",
            valeur: [contexte.chantierId, contexte.chantierNom]
              .filter(Boolean)
              .join(" — "),
          },
        ]
      : []),
    {
      libelle: "Territoire courant",
      valeur:
        contexte.territoireNom ??
        lireTerritoire(contexte.territoireCode) ??
        contexte.territoireCode,
    },
    { libelle: "Jalon", valeur: String(contexte.jalon) },
  ];

  return (
    <div className="flex flex-col gap-1.5 border border-dsfr-blue-france-925 bg-dsfr-alt-blue-france px-3.5 py-3">
      {lignes.map(({ libelle, valeur }) => (
        <div className="flex justify-between gap-3 text-[13px]" key={libelle}>
          <span className="text-dsfr-mention-grey">{libelle}</span>
          <span className="text-right font-bold">{valeur}</span>
        </div>
      ))}
      <span className="text-xs leading-[18px] text-dsfr-mention-grey">
        Repris de la page consultée. Sans précision dans votre question,
        l&apos;assistant l&apos;utilise par défaut.
      </span>
    </div>
  );
};

const DonneesChargees = ({
  conversation,
}: {
  conversation: CurrentConversation;
}) => {
  const { messages } = useChat<PiloteUIMessage>({ chat: conversation.chat });
  const donnees = useMemo(
    () => donneesDuContexte({ messages, lireTerritoire }),
    [messages],
  );

  return (
    <section className="flex flex-col gap-2.5">
      <h3 className={TITRE_SECTION}>
        Données chargées · {donnees.nombreEntrees}
      </h3>
      {donnees.nombreEntrees === 0 ? (
        <p className="m-0 text-xs leading-[18px] text-dsfr-mention-grey">
          L&apos;assistant n&apos;a encore chargé aucune donnée dans cette
          conversation.
        </p>
      ) : null}
      {donnees.groupes.map((groupe) => (
        <div className="flex flex-col gap-1.5" key={groupe.cle}>
          <span className="flex items-center gap-1.5 text-[13px] font-bold">
            <Icone className="h-3.5 w-3.5 text-primary" icone={MapPin2Icon} />
            {groupe.perimetre}
          </span>
          {groupe.entrees.map((entree) => (
            <ContexteErrorBoundary
              fallback={<DonneeIllisible />}
              key={entree.id}
            >
              <CarteDonnee entree={entree} />
            </ContexteErrorBoundary>
          ))}
        </div>
      ))}
      {donnees.illisibles > 0 ? <DonneeIllisible /> : null}
    </section>
  );
};

/**
 * Ce que l'assistant voit pour répondre : le contexte de la page et les
 * données chargées au fil de la conversation, par périmètre (POC PIL-1949).
 */
export const PanneauContexte = ({
  conversation,
  className,
  onFermer,
  retourConversation,
}: {
  conversation: CurrentConversation;
  className?: string;
  onFermer: () => void;
  /** Dans un affichage étroit, le panneau remplace la conversation. */
  retourConversation: boolean;
}) => (
  <aside
    aria-label="Contexte de l'assistant"
    className={clsxm("flex min-h-0 flex-col bg-dsfr-grey-975", className)}
  >
    {retourConversation ? (
      <button
        className="flex shrink-0 items-center gap-1.5 border-b border-dsfr-grey-900 bg-white px-4 py-2.5 text-left text-[13px] font-medium text-primary hover:underline"
        onClick={onFermer}
        type="button"
      >
        <Icone className="h-3.5 w-3.5" icone={ArrowLeftSLineIcon} />
        Revenir à la conversation
      </button>
    ) : null}
    <div className="flex shrink-0 items-start gap-2 border-b border-dsfr-grey-900 bg-white px-4 pb-3 pt-3.5">
      <div className="flex flex-1 flex-col gap-0.5">
        <span className="text-[15px] font-bold">
          Contexte de l&apos;assistant
        </span>
        <span className="text-xs text-dsfr-mention-grey">
          Ce que l&apos;assistant voit pour vous répondre
        </span>
      </div>
      {retourConversation ? null : (
        <button
          aria-label="Fermer le contexte de l'assistant"
          className="flex h-7 w-7 items-center justify-center text-primary hover:bg-dsfr-alt-blue-france"
          onClick={onFermer}
          type="button"
        >
          <Icone className="h-4 w-4" icone={CloseLineIcon} />
        </button>
      )}
    </div>
    <div className="flex min-h-0 flex-1 flex-col gap-[18px] overflow-y-auto p-4">
      <ContexteErrorBoundary fallback={<DonneeIllisible />}>
        <section className="flex flex-col gap-2">
          <h3 className={TITRE_SECTION}>Contexte de la session</h3>
          <ContexteDeSession conversation={conversation} />
        </section>
        <DonneesChargees conversation={conversation} />
      </ContexteErrorBoundary>
    </div>
  </aside>
);
