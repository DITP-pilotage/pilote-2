import { useFormulaireInstruction } from "@/components/PageInstruction/form";
import { Textarea } from "@/components/_commons/Textarea";

type FormCommentaireName =
  | `fichesEvaluation.${string}.objectifs.${string}.commentaire`
  | `fichesEvaluation.${string}.criteres.${string}.commentaire`;

export const CommentaireTextareaInstruction = ({
  name,
  disabled = false,
}: {
  name: FormCommentaireName;
  disabled?: boolean;
}) => {
  const form = useFormulaireInstruction();
  return (
    <Textarea
      control={form.control}
      label="Motif de l'instruction"
      name={name}
      readOnly={disabled}
    />
  );
};
