import { useState } from "react";
import { useEnv } from "@/client/hooks/useEnv";
import { récupérerDétailsSurUnTerritoire } from "@/client/constants/territoires";
import { Icone } from "@/components/_commons/Icone";
import { SparklingIcon } from "@/components/_commons/Icones/SparklingIcon";
import { ChatScenarios, ChatUI } from "@/components/_commons/ChatUI/ChatUI";
import { ConversationHistoryDrawer } from "@/components/_commons/ChatUI/ConversationHistoryDrawer";
import Loader from "@/components/_commons/Loader/Loader";
import { ModalePleinEcran } from "@/components/shared/ModalePleinEcran";
import api from "@/server/infrastructure/api/trpc/api";

export const BoutonSyntheseTerritoire = ({
  territoireCode,
  jalon,
  estDITPAdmin,
}: {
  territoireCode: string;
  jalon: number;
  estDITPAdmin: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const ffHistorique = useEnv("NEXT_PUBLIC_FF_HISTORIQUE_ALBERT");
  const utilsTrpc = api.useUtils();
  const [activeChatId, setActiveChatId] = useState<string>(() =>
    crypto.randomUUID(),
  );
  const { data: conversationChargee, isFetched: conversationChargeeFetched } =
    api.albert.conversations.recuperer.useQuery(
      { id: activeChatId },
      { enabled: ffHistorique === true && isOpen, retry: false },
    );
  const conversationPrete = !ffHistorique || conversationChargeeFetched;
  const demarrerNouvelleConversation = () => {
    setActiveChatId(crypto.randomUUID());
  };
  const rafraichirHistorique = () => {
    utilsTrpc.albert.conversations.lister.invalidate();
  };

  const territoire = récupérerDétailsSurUnTerritoire(territoireCode);
  const estDepartement = territoire.maille === "departementale";
  const estRegion = territoire.maille === "regionale";
  const region =
    estDepartement && territoire.codeParent
      ? récupérerDétailsSurUnTerritoire(territoire.codeParent)
      : null;

  const scenarios: ChatScenarios = {
    kind: "grouped",
    groups: [
      {
        label: "Synthèse",
        scenarios: [
          {
            label: "Synthèse d'un territoire",
            message: "Fais moi la synthèse du territoire ",
            mode: "fill",
          },
          {
            label: "Synthèse d'un chantier sur un territoire",
            message: `Fais moi la synthèse du chantier CH-XXX sur le territoire NOM_TERRITOIRE
Comment se situe ce chantier par rapport aux autres territoires ?
Quelles sont les principales difficultés remontées dans les commentaires ?`,
            mode: "fill",
          },
          ...(estRegion
            ? [
                {
                  label: `Synthèse de ${territoire.nomAffiché} et ses départements`,
                  message: `Fais moi la synthèse de ${territoire.nomAffiché} et ses départements`,
                  mode: "send" as const,
                },
              ]
            : []),
          {
            label: "Chantiers en retard et leurs indicateurs",
            message: `Analyse les chantiers en retard sur ${territoire.nomAffiché}. Pour chaque chantier en retard, récupère également les valeurs de ses indicateurs.`,
            mode: "send",
          },
          ...(estDITPAdmin
            ? [
                {
                  label: "Rapport complet (Markdown)",
                  message: `Crée un rapport de synthèse du territoire ${territoire.nomAffiché} incluant le taux d'avancement, les chantiers en retard, les chantiers en difficulté et leurs indicateurs. Format Markdown`,
                  mode: "send" as const,
                },
                {
                  label: "Tableau de bord du territoire",
                  message: `Compose un tableau de bord pour ${territoire.nomAffiché}. Commence par une première section contenant le taux d'avancement du territoire, le nombre de chantiers en retard, le nombre de chantiers en difficulté et la cartographie du taux d'avancement. Ensuite, récupère la liste des chantiers en difficulté et en retard sur ce territoire, et pour chacun, ajoute une section dédiée avec un titre reprenant le nom du chantier, la météo et le commentaire de synthèse, la cartographie météo en pleine largeur et le tableau de ses indicateurs.`,
                  mode: "send" as const,
                },
              ]
            : []),
        ],
      },
      {
        label: "Comparaison",
        scenarios: [
          {
            label: "Comparer avec un autre territoire",
            message: `Compare ${territoire.nomAffiché} avec `,
            mode: "fill",
          },
          {
            label: `Comparer les taux d'avancement entre le jalon ${jalon} et un autre jalon`,
            message: `Compare les taux d'avancement de ${territoire.nomAffiché} entre le jalon ${jalon} et `,
            mode: "fill",
          },
          ...(estRegion
            ? [
                {
                  label: `Comparer ${territoire.nomAffiché} avec ses départements`,
                  message: `Compare ${territoire.nomAffiché} avec ses départements`,
                  mode: "send" as const,
                },
              ]
            : []),
          ...(estDepartement && region
            ? [
                {
                  label: `Comparer avec les autres départements de ${region.nomAffiché}`,
                  message: `Compare ${territoire.nomAffiché} avec les autres départements de ${region.nomAffiché}`,
                  mode: "send" as const,
                },
              ]
            : []),
        ],
      },
    ],
  };

  return (
    <>
      <button
        className="flex gap-2 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/5 rounded-lg transition-colors"
        onClick={() => setIsOpen(true)}
        type="button"
      >
        <Icone className="w-4 h-4" icone={SparklingIcon} />
      </button>

      {isOpen && (
        <ModalePleinEcran
          open={isOpen}
          onOpenChange={setIsOpen}
          title="Synthèse de territoire"
        >
          <div className="flex h-full">
            {ffHistorique ? (
              <ConversationHistoryDrawer
                chatIdCourant={activeChatId}
                onSelectionner={setActiveChatId}
                onNouvelleConversation={demarrerNouvelleConversation}
              />
            ) : null}
            <div className="flex-1 relative">
              {conversationPrete ? (
                <ChatUI
                  key={activeChatId}
                  chatId={activeChatId}
                  initialMessages={conversationChargee?.messages}
                  onChatFinish={ffHistorique ? rafraichirHistorique : undefined}
                  endpoint="/api/albert/chat"
                  className="h-full"
                  placeholder="Posez une question sur ce territoire..."
                  scenarios={scenarios}
                  agentContext={{
                    jalon,
                    territoireCode,
                    instructions: `Le territoire courant de l'utilisateur est ${territoire.nomAffiché} (code : ${territoireCode}). Utilise ce territoire par défaut lorsque l'utilisateur ne précise pas de territoire dans sa question.`,
                  }}
                />
              ) : (
                <Loader />
              )}
            </div>
          </div>
        </ModalePleinEcran>
      )}
    </>
  );
};
