import { Icone } from "@/components/_commons/Icone";
import { SparklingIcon } from "@/components/_commons/Icones/SparklingIcon";
import type { ChatScenarios } from "@/components/_commons/ChatUI/ChatEmptyState";
import { useAlbertConversation } from "@/components/_commons/ChatUI/AlbertConversationProvider";
import { NOM_ASSISTANT } from "@/components/_commons/ChatUI/libellesAssistant";
import { construireAgentContextTerritoire } from "@/components/PageAccueil/agentContextTerritoire";

export const BoutonSyntheseTerritoire = ({
  territoireCode,
  jalon,
  scenarios,
}: {
  territoireCode: string;
  jalon: number;
  scenarios: ChatScenarios;
}) => {
  const { open } = useAlbertConversation();

  return (
    <button
      aria-label={`Ouvrir l'${NOM_ASSISTANT}`}
      className="flex gap-2 rounded-lg px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/5"
      onClick={() =>
        open({
          scenarios,
          agentContext: construireAgentContextTerritoire({
            territoireCode,
            jalon,
          }),
        })
      }
      type="button"
    >
      <Icone className="h-4 w-4" icone={SparklingIcon} />
    </button>
  );
};
