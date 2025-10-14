import { useFormulaireConsolidation } from "@/components/PageConsolidation/form";
import { InputNoteControlled } from "@/components/_commons/InputNoteControlled";

export const InputNoteConsolidation = ({
  name,
}: {
  name: `objectifs.${string}.note` | `criteres.${string}.note`;
}) => {
  const form = useFormulaireConsolidation();

  return (
    <InputNoteControlled control={form.control} name={name} readOnly={false} />
  );
};
