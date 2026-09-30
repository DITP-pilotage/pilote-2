import { Modale } from "@/components/shared/Modale";
import Alerte from "@/components/_commons/Alerte/Alerte";
import { useExportStep } from "./useExportStep";

export const EtapeDonneeEnCoursDeTelechargement = () => {
  const { goToStep } = useExportStep();

  return (
    <div className="fr-mt-2w">
      <Alerte
        message="Votre fichier d'export sera disponible dans le dossier des fichiers téléchargés de votre navigateur"
        titre="Vos données sont en cours de téléchargement"
        type="succès"
      />
      <div className="w-full flex justify-end fr-mt-2w">
        <Modale.Close asChild>
          <button
            className="fr-link fr-mr-2w"
            title="Fermer la fenêtre modale"
            type="button"
          >
            Annuler
          </button>
        </Modale.Close>
        <button
          className="fr-btn fr-btn--secondary fr-mr-2w"
          onClick={() => goToStep(4)}
          type="button"
        >
          Étape précédente
        </button>
      </div>
    </div>
  );
};
