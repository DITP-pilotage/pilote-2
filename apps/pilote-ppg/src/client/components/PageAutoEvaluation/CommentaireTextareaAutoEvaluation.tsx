import { useRef } from "react";
import { FormTextareaField } from "@/components/shared/FormTextField";
import { Control, FieldValues, Path } from "react-hook-form";
import { useAutosave } from "@/components/Evaluation/useAutosave";

export function CommentaireTextareaAutoEvaluation<T extends FieldValues>({
  name,
  readOnly,
  control,
  onAutosave,
  onFocus,
}: {
  name: Path<T>;
  readOnly: boolean;
  control: Control<T>;
  onAutosave?: () => void;
  onFocus?: () => void;
}) {
  const autosave = useAutosave({ onAutosave });
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  return (
    <FormTextareaField
      charLimit={600}
      control={control}
      name={name}
      {...autosave}
      className="!bg-dsfr-contrast-grey"
      onBlur={() => {
        autosave.onBlur();
      }}
      onFocus={onFocus}
      readOnly={readOnly}
      label="Commentaire"
      ref={textareaRef}
    />
  );
}
