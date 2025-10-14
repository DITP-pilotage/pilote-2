import { useFormulaireConsolidation } from "@/components/PageConsolidation/form";
import { InputNote } from "@/components/_commons/InputNote";

export const InputNoteConsolidation = ({
  name,
}: {
  name: `objectifs.${string}.note` | `criteres.${string}.note`;
}) => {
  const form = useFormulaireConsolidation();

  return <InputNote control={form.control} name={name} readOnly={false} />;
};
