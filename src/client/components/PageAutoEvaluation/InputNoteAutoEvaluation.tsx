import { Control, FieldValues, Path } from "react-hook-form";
import { useCallback, useRef, useEffect } from "react";
import { InputNoteControlled } from "@/components/_commons/InputNoteControlled";

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
  const timeoutRef = useRef<NodeJS.Timeout>();
  const onAutosaveRef = useRef(onAutosave);

  useEffect(() => {
    onAutosaveRef.current = onAutosave;
  }, [onAutosave]);

  const handleChange = useCallback(() => {
    if (!onAutosaveRef.current) return;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      onAutosaveRef.current?.();
    }, 400);
  }, []);

  const handleBlur = useCallback(() => {
    if (!onAutosaveRef.current) return;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    onAutosaveRef.current();
  }, []);

  return (
    <InputNoteControlled
      control={control}
      name={name}
      onBlur={handleBlur}
      onChange={handleChange}
      readOnly={readOnly}
    />
  );
}
