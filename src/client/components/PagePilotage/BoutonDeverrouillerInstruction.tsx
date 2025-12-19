import { useModifierEtatFichesInstruction } from "@/components/PagePilotage/useModifierEtatFichesInstruction";

export const BoutonDeverrouillerInstruction = ({
  fichesSelectionneesIds,
  disabled,
}: {
  fichesSelectionneesIds: string[];
  disabled: boolean;
}) => {
  const { modifierEtat } = useModifierEtatFichesInstruction();

  const handleDebloquerFiches = async () => {
    await modifierEtat(fichesSelectionneesIds, false);
  };

  return (
    <button
      className="fr-link text-left !text-xs"
      disabled={disabled}
      onClick={handleDebloquerFiches}
      type="button"
    >
      déverrouiller l'instruction
    </button>
  );
};
