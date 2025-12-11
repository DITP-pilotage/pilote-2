import { FunctionComponent } from "react";
import { Dialog } from "radix-ui";
import { Modale } from "@/components/shared/Modale";

interface ConfirmerValidationSaisieProps {
  typeEvaluation: "objectifs" | "manieres-de-servir";
  annee: number;
  onConfirm: () => void;
  isPending: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ConfirmerValidationSaisie: FunctionComponent<
  ConfirmerValidationSaisieProps
> = ({ typeEvaluation, annee, onConfirm, isPending, open, onOpenChange }) => {
  const typeLabel =
    typeEvaluation === "objectifs"
      ? "vos objectifs individuels"
      : "votre manière de servir";

  return (
    <Modale
      onOpenChange={onOpenChange}
      open={open}
      size="md"
      title="Confirmation de validation"
    >
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
        <Dialog.Close asChild>
          <button
            className="fr-btn fr-btn--secondary"
            disabled={isPending}
            type="button"
          >
            Annuler
          </button>
        </Dialog.Close>
        <button
          className="fr-btn"
          disabled={isPending}
          onClick={onConfirm}
          type="button"
        >
          Confirmer la validation
        </button>
      </div>
    </Modale>
  );
};
