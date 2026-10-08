import { Modale } from "@/components/shared/Modale";
import { Button } from "@/components/shared/Button";
import Alerte from "@/components/_commons/Alerte/Alerte";
import { useExportStep } from "./useExportStep";

export const EtapeDonneeEnCoursDeTelechargement = () => {
  const { goToStep } = useExportStep();

  return (
    <div className="mt-4">
      <Alerte
        message="Votre fichier d'export sera disponible dans le dossier des fichiers téléchargés de votre navigateur"
        titre="Vos données sont en cours de téléchargement"
        type="succès"
      />
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
        <Button
          variant="secondary"
          className="mr-4"
          onClick={() => goToStep(4)}
          type="button"
        >
          Étape précédente
        </Button>
      </div>
    </div>
  );
};
