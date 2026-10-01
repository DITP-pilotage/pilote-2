import { ReactNode } from "react";
import { FormTextareaField } from "@/components/shared/FormTextField";
import { useFormulaireEvaluation } from "@/components/Evaluation/form";
import { useAutosave } from "@/components/Evaluation/useAutosave";

type FormCommentaireName =
  | `fichesEvaluation.${string}.objectifs.${string}.commentaire`
  | `fichesEvaluation.${string}.criteres.${string}.commentaire`;

export const CommentaireTextareaEvaluation = ({
  name,
  disabled = false,
  label,
  onAutosave,
  onFocus,
}: {
  name: FormCommentaireName;
  disabled?: boolean;
  label: ReactNode;
  onAutosave?: () => void;
  onFocus?: () => void;
}) => {
  const form = useFormulaireEvaluation();
  const autosave = useAutosave({ onAutosave });

  return (
    <FormTextareaField
      charLimit={600}
      className="!bg-dsfr-contrast-grey !text-sm font-normal min-h-[38px]"
      control={form.control}
      label={label}
      name={name}
      {...autosave}
      onFocus={onFocus}
      readOnly={disabled}
    />
  );
};
