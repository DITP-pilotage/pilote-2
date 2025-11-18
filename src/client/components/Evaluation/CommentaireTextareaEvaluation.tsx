import { useEffect } from "react";
import { useFormulaireEvaluation } from "@/components/Evaluation/form";
import { Textarea } from "@/components/_commons/Textarea";
import { useAutosave } from "@/components/Evaluation/useAutosave";

type FormCommentaireName =
  | `fichesEvaluation.${string}.objectifs.${string}.commentaire`
  | `fichesEvaluation.${string}.criteres.${string}.commentaire`;

export const CommentaireTextareaEvaluation = ({
  name,
  disabled = false,
  label,
  onAutosave,
}: {
  name: FormCommentaireName;
  disabled?: boolean;
  label: string;
  onAutosave?: () => void;
}) => {
  const form = useFormulaireEvaluation();
  const autosave = useAutosave({ onAutosave });

  return (
    <Textarea
      control={form.control}
      label={label}
      name={name}
      {...autosave}
      readOnly={disabled}
    />
  );
};
