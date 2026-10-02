import { Button } from "@/components/shared/Button";
import { Modale } from "@/components/shared/Modale";
import { RadioGroup } from "@/components/shared/RadioGroup";
import { useExportStep } from "./useExportStep";

export const EtapePerimetreExport = () => {
  const {
    exportState: { isAvecFiltre },
    updateExport,
    goToStep,
  } = useExportStep();

  return (
    <div>
      <p className="fr-mb-1w">Précisez le périmètre de votre export :</p>
      <RadioGroup.Root
        name="ressource-à-exporter"
        onValueChange={(valeur) =>
          updateExport({ isAvecFiltre: valeur === "indicateurs" })
        }
        value={isAvecFiltre ? "indicateurs" : "chantiers"}
      >
        <RadioGroup.Item
          id="chantiers"
          libelle="exporter tous les éléments sur tous les territoires qui vous sont ouverts en lecture"
          value="chantiers"
        />
        <RadioGroup.Item
          aide="le cas échéant, le territoire sélectionné et tous les territoires inclus aux mailles inférieures seront intégrés dans l'export"
          id="indicateurs"
          libelle="exporter les éléments de la sélection présentement active dans PILOTE"
          value="indicateurs"
        />
      </RadioGroup.Root>
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
        <Button
          variant="secondary"
          className="mr-4"
          onClick={() => goToStep(1)}
          type="button"
        >
          Étape précédente
        </Button>
        <Button
          variant="primary"
          className="mr-4"
          onClick={() => goToStep(3)}
          type="button"
        >
          Étape suivante
        </Button>
      </div>
    </div>
  );
};
