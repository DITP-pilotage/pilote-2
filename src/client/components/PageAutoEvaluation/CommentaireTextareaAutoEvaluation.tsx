import { useRef } from "react";
import { Control, FieldValues, Path } from "react-hook-form";
import { Textarea, TextareaRef } from "@/components/_commons/Textarea";
import { useAutosave } from "@/components/Evaluation/useAutosave";

export function CommentaireTextareaAutoEvaluation<T extends FieldValues>({
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
  const textareaRef = useRef<TextareaRef>(null);

  return (
    <Textarea
      charLimit={600}
      control={control}
      name={name}
      {...autosave}
      onBlur={() => {
        autosave.onBlur();
      }}
      readOnly={readOnly}
      textareaRef={textareaRef}
    />
  );
}
