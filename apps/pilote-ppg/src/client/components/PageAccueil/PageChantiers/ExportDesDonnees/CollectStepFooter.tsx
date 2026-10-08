import { Button } from "@/components/shared/Button";
import { Modale } from "@/components/shared/Modale";
import { useExportStep } from "./useExportStep";

export const CollectStepFooter = () => {
  const { goToStep } = useExportStep();

  return (
    <div className="mt-4 flex w-full items-center justify-end">
      <Modale.Close asChild>
        <Button
          className="mr-4"
          title="Fermer la fenêtre modale"
          variant="link"
        >
          Annuler
        </Button>
      </Modale.Close>
      <Button className="mr-4" onClick={() => goToStep(2)} variant="secondary">
        Étape précédente
      </Button>
      <Button className="mr-4" onClick={() => goToStep(4)} variant="primary">
        Étape suivante
      </Button>
    </div>
  );
};
