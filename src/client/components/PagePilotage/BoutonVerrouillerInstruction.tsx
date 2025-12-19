import { useModifierEtatFichesInstruction } from "@/components/PagePilotage/useModifierEtatFichesInstruction";

export const BoutonVerrouillerInstruction = ({
  fichesSelectionneesIds,
  disabled,
}: {
  fichesSelectionneesIds: string[];
  disabled: boolean;
}) => {
  const { modifierEtat } = useModifierEtatFichesInstruction();

  const handleBloquerFiches = async () => {
    await modifierEtat(fichesSelectionneesIds, true);
  };

  return (
    <button
      className="fr-link text-left !text-xs"
      disabled={disabled}
      onClick={handleBloquerFiches}
      type="button"
    >
      verouiller l'instruction
    </button>
  );
};
