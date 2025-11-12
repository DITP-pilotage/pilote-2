import { useFormEvaluation } from "@/components/PageAutoEvaluation/form";
import { InputNoteControlled } from "@/components/_commons/InputNoteControlled";

export const InputNoteAutoEvaluation = ({
  name,
  readOnly,
}: {
  name: `criteres.${number}.note` | `objectifs.${number}.note`;
  readOnly: boolean;
}) => {
  const form = useFormEvaluation();

  return (
    <InputNoteControlled
      control={form.control}
      name={name}
      readOnly={readOnly}
    />
  );
};
