import { useState } from "react";
import { récupérerDétailsSurUnTerritoire } from "@/client/constants/territoires";
import { Icone } from "@/components/_commons/Icone";
import { SparklingIcon } from "@/components/_commons/Icones/SparklingIcon";
import { ChatScenarios, ChatUI } from "@/components/_commons/ChatUI/ChatUI";
import { ModalePleinEcran } from "@/components/shared/ModalePleinEcran";

export const BoutonSyntheseTerritoire = ({
  territoireCode,
  jalon,
}: {
  territoireCode: string;
  jalon: number;
}) => {
  const [isOpen, setIsOpen] = useState(false);
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
            label: `Synthèse de ${territoire.nomAffiché}`,
            message: `Fais moi la synthèse de ${territoire.nomAffiché}`,
            mode: "send",
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
          {
            label: "Rapport complet (Markdown)",
            message: `Crée un rapport de synthèse du territoire ${territoire.nomAffiché} incluant le taux d'avancement, les chantiers en retard, les chantiers en difficulté et leurs indicateurs. Format Markdown`,
            mode: "send",
          },
        ],
      },
      {
        label: "Comparaison",
        scenarios: [
          {
            label: "Comparer avec un autre territoire",
            message: `Compare le taux d'avancement de ${territoire.nomAffiché} avec `,
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
        className="flex self-center mb-4 ml-auto gap-2 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/5 rounded-lg transition-colors"
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
          <ChatUI
            endpoint="/api/albert/chat"
            className="h-full"
            placeholder="Posez une question sur ce territoire..."
            scenarios={scenarios}
            agentContext={{
              jalon,
              instructions: `Le territoire courant de l'utilisateur est ${territoire.nomAffiché} (code : ${territoireCode}). Utilise ce territoire par défaut lorsque l'utilisateur ne précise pas de territoire dans sa question.`,
            }}
          />
        </ModalePleinEcran>
      )}
    </>
  );
};
