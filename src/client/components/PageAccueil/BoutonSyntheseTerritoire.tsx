import { useState } from "react";
import { récupérerDétailsSurUnTerritoire } from "@/client/constants/territoires";
import { Icone } from "@/components/_commons/Icone";
import { SparklingIcon } from "@/components/_commons/Icones/SparklingIcon";
import { ChatScenario, ChatUI } from "@/components/_commons/ChatUI/ChatUI";
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

  const scenarios: ChatScenario[] = [
    {
      label: `Synthèse de ${territoire.nomAffiché}`,
      message: `Fais moi la synthèse de ${territoire.nomAffiché}`,
      mode: "send",
    },
    {
      label: `Chantiers en retard sur ${territoire.nomAffiché}`,
      message: `Chantiers en retard sur ${territoire.nomAffiché}`,
      mode: "send",
    },
    {
      label: `Chantiers en difficulté sur ${territoire.nomAffiché}`,
      message: `Chantiers en difficulté sur ${territoire.nomAffiché}`,
      mode: "send",
    },
    {
      label: "Comparer avec un autre territoire",
      message: `Compare ${territoire.nomAffiché} avec `,
      mode: "fill",
    },
  ];

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
