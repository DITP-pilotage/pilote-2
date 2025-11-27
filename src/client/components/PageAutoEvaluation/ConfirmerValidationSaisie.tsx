import { FunctionComponent } from "react";
import { createPortal } from "react-dom";
import Modale from "@/components/_commons/Modale/Modale";

interface ConfirmerValidationSaisieProps {
  generatedHTMLID: string;
  typeEvaluation: "objectifs" | "manieres-de-servir";
  annee: number;
  onConfirm: () => void;
  isPending: boolean;
}

export const ConfirmerValidationSaisie: FunctionComponent<
  ConfirmerValidationSaisieProps
> = ({ generatedHTMLID, typeEvaluation, annee, onConfirm, isPending }) => {
  const typeLabel =
    typeEvaluation === "objectifs"
      ? "vos objectifs individuels"
      : "votre manière de servir";

  return createPortal(
    <Modale idHtml={generatedHTMLID} tailleModale="md">
      <h2 className="fr-h4 fr-mb-2w">Confirmation de validation</h2>
      <p className="fr-text fr-mb-2w">
        Vous êtes sur le point de valider définitivement l'auto-évaluation de{" "}
        {typeLabel} pour l'année {annee}.
      </p>
      <p className="fr-text fr-mb-2w">
        Une fois validée, votre auto-évaluation restera consultable mais ne
        pourra plus être modifiée.
      </p>
      <p className="fr-text fr-mb-3w">
        <strong>Souhaitez-vous confirmer cette validation ?</strong>
      </p>
      <div className="w-full flex justify-end gap-2">
        <button
          aria-controls={generatedHTMLID}
          className="fr-btn fr-btn--secondary"
          data-fr-opened="false"
          disabled={isPending}
          type="button"
        >
          Annuler
        </button>
        <button
          className="fr-btn"
          disabled={isPending}
          onClick={onConfirm}
          type="button"
        >
          Confirmer la validation
        </button>
      </div>
    </Modale>,
    document.body,
  );
};
