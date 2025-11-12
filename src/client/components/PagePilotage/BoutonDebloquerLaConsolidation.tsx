import { Bouton } from "@/components/_commons/Bouton/Bouton";
import { useDebloquerFiches } from "@/components/PagePilotage/useDebloquerFiches";

export const BoutonDebloquerLaConsolidation = ({
  fichesSelectionneesIds,
  disabled,
}: {
  fichesSelectionneesIds: string[];
  disabled: boolean;
}) => {
  const debloquerFiches = useDebloquerFiches();

  const handleDebloquerFiches = async () => {
    await debloquerFiches(fichesSelectionneesIds);
  };

  return (
    <Bouton
      className="!text-sm"
      disabled={disabled}
      label="Débloquer la consolidation"
      onClick={handleDebloquerFiches}
      variant="secondary"
    />
  );
};
