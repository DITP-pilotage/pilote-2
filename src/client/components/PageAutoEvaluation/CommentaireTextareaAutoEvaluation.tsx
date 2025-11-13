import { useState, useRef, useCallback, useEffect } from "react";
import { flushSync } from "react-dom";
import { Control, FieldValues, Path } from "react-hook-form";
import { Icone } from "@/components/_commons/Icone";
import { AddLineIcon } from "@/components/_commons/Icones/AddLineIcon";
import { Textarea, TextareaRef } from "@/components/_commons/Textarea";

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
  const textareaRef = useRef<TextareaRef>(null);
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

  const handleBlur = useCallback(
    (event: React.FocusEvent<HTMLTextAreaElement>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      if (!event.target.value) {
        setDisplayComment(false);
      } else if (onAutosaveRef.current) {
        onAutosaveRef.current();
      }
    },
    [],
  );

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
      onBlur={handleBlur}
      onChange={handleChange}
      readOnly={readOnly}
      textareaRef={textareaRef}
    />
  );
}
