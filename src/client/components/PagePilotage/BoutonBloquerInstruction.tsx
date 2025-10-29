import { Bouton } from "@/components/_commons/Bouton/Bouton";
import { useModifierEtatFichesInstruction } from "@/components/PagePilotage/useModifierEtatFichesInstruction";

export const BoutonBloquerInstruction = ({
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
    <Bouton
      className="!text-sm"
      disabled={disabled}
      label="Bloquer l'instruction"
      onClick={handleBloquerFiches}
      variant="secondary"
    />
  );
};
