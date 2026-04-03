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
            label: "Analyser les chantiers en retard",
            message: `Analyse les chantiers en retard sur ${territoire.nomAffiché} sur la base des commentaires`,
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
          {
            label: "Comparer un chantier sur plusieurs territoires",
            message: `Compare le chantier `,
            mode: "fill",
          },
        ],
      },
      {
        label: "Analyse",
        scenarios: [
          {
            label: "Analyser un chantier sur le territoire",
            message: `Analyse les indicateurs du chantier `,
            mode: "fill",
          },
          {
            label: "Identifier les plus grands écarts à la médiane",
            message: `Identifie les chantiers avec le plus grand écart à la médiane sur ${territoire.nomAffiché}`,
            mode: "send",
          },
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
            agentContext={{ jalon, territoireCode }}
          />
        </ModalePleinEcran>
      )}
    </>
  );
};
