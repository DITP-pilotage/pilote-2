import { useState } from "react";
import { récupérerDétailsSurUnTerritoire } from "@/client/constants/territoires";
import { Icone } from "@/components/_commons/Icone";
import { SparklingIcon } from "@/components/_commons/Icones/SparklingIcon";
import { ChatUI } from "@/components/_commons/ChatUI/ChatUI";
import { ModalePleinEcran } from "@/components/shared/ModalePleinEcran";

export const BoutonSyntheseTerritoire = ({
  territoireCode,
}: {
  territoireCode: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const territoire = récupérerDétailsSurUnTerritoire(territoireCode);

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
            emptyStateText="La synthèse est en cours de génération..."
            placeholder="Posez une question sur ce territoire..."
            initialMessage={`Fais moi la synthèse de ${territoire.nomAffiché}`}
          />
        </ModalePleinEcran>
      )}
    </>
  );
};
