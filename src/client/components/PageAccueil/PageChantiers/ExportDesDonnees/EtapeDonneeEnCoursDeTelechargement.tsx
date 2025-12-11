import { parseAsInteger, useQueryState } from "nuqs";
import { Dialog } from "radix-ui";
import Alerte from "@/components/_commons/Alerte/Alerte";

export const EtapeDonneeEnCoursDeTelechargement = () => {
  const [, setEtapeCourante] = useQueryState(
    "etapeCourante",
    parseAsInteger.withOptions({
      shallow: true,
      history: "push",
    }),
  );

  return (
    <div className="fr-mt-2w">
      <Alerte
        message="Votre fichier d'export sera disponible dans le dossier des fichiers téléchargés de votre navigateur"
        titre="Vos données sont en cours de téléchargement"
        type="succès"
      />
      <div className="w-full flex justify-end fr-mt-2w">
        <Dialog.Close asChild>
          <button
            className="fr-link fr-mr-2w"
            title="Fermer la fenêtre modale"
            type="button"
          >
            Annuler
          </button>
        </Dialog.Close>
        <button
          className="fr-btn fr-btn--secondary fr-mr-2w"
          onClick={() => setEtapeCourante(4)}
          type="button"
        >
          Étape précédente
        </button>
      </div>
    </div>
  );
};
