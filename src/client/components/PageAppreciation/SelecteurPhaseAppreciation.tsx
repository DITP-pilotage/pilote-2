type StatutCompletionAppreciation =
  | "PAS_DEBUTE"
  | "AUTO_EVAL_EN_COURS"
  | "APPRECIATION_EN_COURS"
  | "TERMINE";

interface SelecteurPhaseAppreciationProps {
  value: StatutCompletionAppreciation;
  onChange: (value: StatutCompletionAppreciation) => void;
}

const OPTIONS: Array<{
  value: StatutCompletionAppreciation;
  label: string;
}> = [
  { value: "PAS_DEBUTE", label: "Pas débuté" },
  { value: "AUTO_EVAL_EN_COURS", label: "Auto-évaluation en cours" },
  {
    value: "APPRECIATION_EN_COURS",
    label: "Appréciation en cours",
  },
  { value: "TERMINE", label: "Terminé" },
];

export const SelecteurPhaseAppreciation = ({
  value,
  onChange,
}: SelecteurPhaseAppreciationProps) => {
  return (
    <div className="mb-6">
      <label
        className="block mb-2 text-sm font-medium text-gray-700"
        htmlFor="phase-appreciation"
      >
        Phase d'appréciation (pour tester les différentes phases):
      </label>
      <select
        className="block w-64 px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        id="phase-appreciation"
        onChange={(event) =>
          onChange(event.target.value as StatutCompletionAppreciation)
        }
        value={value}
      >
        {OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};
