import { useFormulaireEvaluation } from "@/components/Evaluation/form";
import { Textarea } from "@/components/_commons/Textarea";

type FormCommentaireName =
  | `fichesEvaluation.${string}.objectifs.${string}.commentaire`
  | `fichesEvaluation.${string}.criteres.${string}.commentaire`;

export const CommentaireTextareaEvaluation = ({
  name,
  disabled = false,
  label,
}: {
  name: FormCommentaireName;
  disabled?: boolean;
  label: string;
}) => {
  const form = useFormulaireEvaluation();
  return (
    <Textarea
      control={form.control}
      label={label}
      name={name}
      readOnly={disabled}
    />
  );
};
