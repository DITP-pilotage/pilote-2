import { Control, FieldValues, Path } from "react-hook-form";
import { InputNoteControlled } from "@/components/_commons/InputNoteControlled";
import { useAutosave } from "@/components/Evaluation/useAutosave";

export function InputNoteAutoEvaluation<T extends FieldValues>({
  name,
  readOnly,
  control,
  onAutosave,
}: {
  name: Path<T>;
  readOnly: boolean;
  control: Control<T>;
  onAutosave?: () => void;
}) {
  const autosave = useAutosave({ onAutosave });

  return (
    <InputNoteControlled
      control={control}
      name={name}
      {...autosave}
      readOnly={readOnly}
    />
  );
}
