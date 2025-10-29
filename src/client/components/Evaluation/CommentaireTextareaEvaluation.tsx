import { useFormulaireEvaluation } from "@/components/Evaluation/form";
import { Textarea } from "@/components/_commons/Textarea";

type FormCommentaireName =
  | `fichesEvaluation.${string}.objectifs.${string}.commentaire`
  | `fichesEvaluation.${string}.criteres.${string}.commentaire`;

export const CommentaireTextareaEvaluation = ({
  name,
  disabled = false,
}: {
  name: FormCommentaireName;
  disabled?: boolean;
}) => {
  const form = useFormulaireEvaluation();
  return (
    <Textarea
      control={form.control}
      label="Motif de la consolidation"
      name={name}
      readOnly={disabled}
    />
  );
};
