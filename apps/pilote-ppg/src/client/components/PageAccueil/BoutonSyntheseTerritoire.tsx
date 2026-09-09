import { récupérerDétailsSurUnTerritoire } from "@/client/constants/territoires";
import { Icone } from "@/components/_commons/Icone";
import { SparklingIcon } from "@/components/_commons/Icones/SparklingIcon";
import type { ChatScenarios } from "@/components/_commons/ChatUI/ChatEmptyState";
import { useAlbertConversation } from "@/components/_commons/ChatUI/AlbertConversationProvider";

export const BoutonSyntheseTerritoire = ({
  territoireCode,
  jalon,
  scenarios,
}: {
  territoireCode: string;
  jalon: number;
  scenarios: ChatScenarios;
}) => {
  const { ouvrir } = useAlbertConversation();
  const territoire = récupérerDétailsSurUnTerritoire(territoireCode);

  return (
    <button
      aria-label="Ouvrir Albert"
      className="flex gap-2 rounded-lg px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/5"
      onClick={() =>
        ouvrir({
          scenarios,
          agentContext: {
            jalon,
            territoireCode,
            instructions: `Le territoire courant de l'utilisateur est ${territoire.nomAffiché} (code : ${territoireCode}). Utilise ce territoire par défaut lorsque l'utilisateur ne précise pas de territoire dans sa question.`,
          },
        })
      }
      type="button"
    >
      <Icone className="h-4 w-4" icone={SparklingIcon} />
    </button>
  );
};
