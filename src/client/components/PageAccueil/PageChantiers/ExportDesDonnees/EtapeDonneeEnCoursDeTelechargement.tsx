import { parseAsInteger, useQueryState } from "nuqs";
import { useEffect } from "react";
import { Dialog } from "radix-ui";
import { Toaster } from "@/client/utils/toaster";

export const EtapeDonneeEnCoursDeTelechargement = () => {
  const [, setEtapeCourante] = useQueryState(
    "etapeCourante",
    parseAsInteger.withOptions({
      shallow: true,
      history: "push",
    }),
  );

  useEffect(() => {
    Toaster.success("Vos données sont en cours de téléchargement");
  }, []);

  return (
    <div className="fr-mt-2w">
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
