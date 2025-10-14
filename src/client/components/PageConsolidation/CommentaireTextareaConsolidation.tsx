import { useFormulaireConsolidation } from "@/components/PageConsolidation/form";
import { Textarea } from "@/components/_commons/Textarea";

export const CommentaireTextareaConsolidation = ({
  name,
}: {
  name: `objectifs.${string}.commentaire` | `criteres.${string}.commentaire`;
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
