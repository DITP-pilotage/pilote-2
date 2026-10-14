import { FunctionComponent } from "react";
import { Modale } from "@/components/shared/Modale";
import { Button } from "@/components/shared/Button";

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
      <p className="mb-4">
        Vous êtes sur le point de valider définitivement l'auto-évaluation de{" "}
        {typeLabel} pour l'année {annee}.
      </p>
      <p className="mb-4">
        Une fois validée, votre auto-évaluation restera consultable mais ne
        pourra plus être modifiée.
      </p>
      <p className="mb-6">
        <strong>Souhaitez-vous confirmer cette validation ?</strong>
      </p>
      <div className="w-full flex justify-end gap-2">
        <Modale.Close asChild>
          <Button disabled={isPending} variant="secondary">
            Annuler
          </Button>
        </Modale.Close>
        <Button disabled={isPending} onClick={onConfirm}>
          Confirmer la validation
        </Button>
      </div>
    </Modale>
  );
};
