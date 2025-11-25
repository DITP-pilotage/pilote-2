import { Control, FieldValues, Path } from "react-hook-form";
import { InputNoteControlled } from "@/components/_commons/InputNoteControlled";
import { useAutosave } from "@/components/Evaluation/useAutosave";

export function InputNoteAutoEvaluation<T extends FieldValues>({
  name,
  readOnly,
  control,
  onAutosave,
  label,
}: {
  name: Path<T>;
  readOnly: boolean;
  control: Control<T>;
  onAutosave?: () => void;
  label?: string;
}) {
  const autosave = useAutosave({ onAutosave });

  return (
    <InputNoteControlled
      control={control}
      label={label}
      name={name}
      {...autosave}
      readOnly={readOnly}
    />
  );
}
