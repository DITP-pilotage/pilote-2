import { useFormulaireConsolidation } from "@/components/PageConsolidation/form";
import { Textarea } from "@/components/_commons/Textarea";

type FormCommentaireName =
  | `fichesEvaluation.${string}.objectifs.${string}.commentaire`
  | `fichesEvaluation.${string}.criteres.${string}.commentaire`;

export const CommentaireTextareaConsolidation = ({
  name,
}: {
  name: FormCommentaireName;
}) => {
  const form = useFormulaireConsolidation();
  return (
    <Textarea
      control={form.control}
      label="Motif de la consolidation"
      name={name}
      readOnly={false}
    />
  );
};
