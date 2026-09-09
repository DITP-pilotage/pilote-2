import { AlbertMonogramme } from "@/components/_commons/ChatUI/AlbertMonogramme";
import { useChatContext } from "@/components/_commons/ChatUI/ChatContext";

export type ChatScenario = {
  label: string;
  message: string;
  mode: "send" | "fill";
};

export type ChatScenarioGroup = {
  label: string;
  scenarios: ChatScenario[];
};

export type ChatScenarios =
  | { kind: "flat"; scenarios: ChatScenario[] }
  | { kind: "grouped"; groups: ChatScenarioGroup[] };

export type ContexteAccueil = {
  territoireNom: string;
  jalon: number;
};

export const ChatEmptyState = ({
  scenarios,
  contexte,
}: {
  scenarios: ChatScenarios;
  contexte?: ContexteAccueil;
}) => {
  const { sendMessage, fillInput } = useChatContext();

  const handleClick = (scenario: ChatScenario) => {
    if (scenario.mode === "send") {
      sendMessage({ text: scenario.message });
    } else {
      fillInput(scenario.message);
    }
  };

  const renderScenarioGrid = (scenarioList: ChatScenario[]) => (
    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
      {scenarioList.map((scenario) => (
        <button
          className="flex min-h-[76px] items-start border border-dsfr-grey-900 bg-white p-3.5 text-left text-sm font-medium leading-5 text-dsfr-grey-50 transition-colors hover:border-primary hover:bg-dsfr-alt-blue-france hover:text-primary"
          key={scenario.label}
          onClick={() => handleClick(scenario)}
          type="button"
        >
          {scenario.label}
        </button>
      ))}
    </div>
  );

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-7 py-8">
      <div className="flex flex-col gap-3">
        <AlbertMonogramme taille="lg" />
        <h2 className="text-[26px] font-bold leading-8 text-dsfr-grey-50 fr-mb-0">
          Bonjour, je suis Albert.
        </h2>
        <p className="text-[15px] leading-6 text-dsfr-mention-grey fr-mb-0">
          {contexte ? (
            <>
              Je synthétise les données PILOTE de{" "}
              <strong className="text-dsfr-grey-50">
                {contexte.territoireNom}
              </strong>{" "}
              au jalon {contexte.jalon} : chantiers, indicateurs, commentaires.
            </>
          ) : (
            <>
              Je synthétise les données PILOTE : chantiers, indicateurs,
              commentaires.
            </>
          )}{" "}
          Choisissez un point de départ ou posez votre question.
        </p>
      </div>
      {scenarios.kind === "flat" ? (
        renderScenarioGrid(scenarios.scenarios)
      ) : (
        <div className="flex flex-col gap-6">
          {scenarios.groups
            .filter((group) => group.scenarios.length > 0)
            .map((group) => (
              <div className="flex flex-col gap-2.5" key={group.label}>
                <p className="text-[11px] font-bold uppercase tracking-wide text-dsfr-mention-grey fr-mb-0">
                  {group.label}
                </p>
                {renderScenarioGrid(group.scenarios)}
              </div>
            ))}
        </div>
      )}
    </div>
  );
};
