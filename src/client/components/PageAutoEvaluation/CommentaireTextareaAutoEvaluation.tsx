import { useState, useRef } from "react";
import { flushSync } from "react-dom";
import { Control, FieldValues, Path } from "react-hook-form";
import { Icone } from "@/components/_commons/Icone";
import { AddLineIcon } from "@/components/_commons/Icones/AddLineIcon";
import { Textarea, TextareaRef } from "@/components/_commons/Textarea";
import { useAutosave } from "@/components/Evaluation/useAutosave";

export function CommentaireTextareaAutoEvaluation<T extends FieldValues>({
  name,
  readOnly,
  defaultOpen,
  control,
  onAutosave,
}: {
  name: Path<T>;
  readOnly: boolean;
  defaultOpen: boolean;
  control: Control<T>;
  onAutosave?: () => void;
}) {
  const [displayComment, setDisplayComment] = useState(defaultOpen);
  const autosave = useAutosave({ onAutosave });
  const textareaRef = useRef<TextareaRef>(null);

  if (!displayComment) {
    return (
      <button
        className="-ml-4 !text-xs !text-dsfr-grey-200 inline-flex w-fit gap-1 items-center"
        onClick={() => {
          flushSync(() => {
            setDisplayComment(true);
          });
          textareaRef.current?.focus();
        }}
        type="button"
      >
        <Icone className="w-3 h-3 text-current" icone={AddLineIcon} /> Ajouter
        un commentaire
      </button>
    );
  }

  return (
    <Textarea
      control={control}
      name={name}
      {...autosave}
      onBlur={(event) => {
        if (!event.target.value) {
          setDisplayComment(false);
        }
        autosave.onBlur();
      }}
      readOnly={readOnly}
      textareaRef={textareaRef}
    />
  );
}
