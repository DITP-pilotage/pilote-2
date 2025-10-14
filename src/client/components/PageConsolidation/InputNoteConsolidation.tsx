import { useFormulaireConsolidation } from "@/components/PageConsolidation/form";
import { InputNoteControlled } from "@/components/_commons/InputNoteControlled";

export const InputNoteConsolidation = ({
  name,
}: {
  name: `objectifs.${string}.note` | `criteres.${string}.note`;
}) => {
  const form = useFormulaireConsolidation();
  const commentaireName = name.replace(".note", ".commentaire");

  return (
    <InputNoteControlled
      control={form.control}
      name={name}
      onChange={() =>
        form.trigger(
          commentaireName as
            | `objectifs.${string}.commentaire`
            | `criteres.${string}.commentaire`,
        )
      }
      readOnly={false}
    />
  );
};
