import { Control, FieldValues, Path } from "react-hook-form";
import { InputNoteControlled } from "@/components/_commons/InputNoteControlled";

export function InputNoteAutoEvaluation<T extends FieldValues>({
  name,
  readOnly,
  control,
}: {
  name: Path<T>;
  readOnly: boolean;
  control: Control<T>;
}) {
  return (
    <InputNoteControlled control={control} name={name} readOnly={readOnly} />
  );
}
