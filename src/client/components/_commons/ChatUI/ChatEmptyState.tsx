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

export const ChatEmptyState = ({
  scenarios,
}: {
  scenarios: ChatScenarios;
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
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {scenarioList.map((scenario) => (
        <button
          key={scenario.label}
          className="text-left rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-700 hover:border-primary hover:bg-primary/5 hover:text-primary transition-colors"
          onClick={() => handleClick(scenario)}
          type="button"
        >
          {scenario.label}
        </button>
      ))}
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto mt-8 px-4">
      <p className="text-sm text-gray-500 mb-4 text-center">
        Exemples de ce que vous pouvez faire...
      </p>
      {scenarios.kind === "flat" ? (
        renderScenarioGrid(scenarios.scenarios)
      ) : (
        <div className="space-y-6">
          {scenarios.groups
            .filter((group) => group.scenarios.length > 0)
            .map((group) => (
              <div key={group.label}>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
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
