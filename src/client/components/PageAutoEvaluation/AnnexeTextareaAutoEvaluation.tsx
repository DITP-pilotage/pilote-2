import { useRef, useState } from "react";
import { flushSync } from "react-dom";
import { Control, Controller, FieldValues, Path } from "react-hook-form";
import { Icone } from "@/components/_commons/Icone";
import { AddLineIcon } from "@/components/_commons/Icones/AddLineIcon";
import {
  EditeurRiche,
  EditeurRicheRef,
} from "@/components/_commons/ÉditeurRiche/EditeurRiche";
import { Bouton } from "@/components/_commons/Bouton/Bouton";
import { ChatForwardIcon } from "@/components/_commons/Icones/ChatForwardIcon";
import { useAutosave } from "@/components/Evaluation/useAutosave";

export function AnnexeTextareaAutoEvaluation<T extends FieldValues>({
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
  const [displayAnnexe, setDisplayAnnexe] = useState(false);
  const editeurRef = useRef<EditeurRicheRef>(null);
  const autosave = useAutosave({ onAutosave });

  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => {
        if (!displayAnnexe) {
          const hasContent = field.value && field.value.trim() !== "";
          return (
            <button
              className="-ml-4 !text-xs !text-dsfr-grey-200 inline-flex w-fit gap-1 items-center"
              onClick={() => {
                flushSync(() => {
                  setDisplayAnnexe(true);
                });
                editeurRef.current?.focus();
              }}
              onFocus={onFocus}
              type="button"
            >
              {hasContent ? (
                <>
                  <Icone
                    className="w-3 h-3 text-current"
                    icone={ChatForwardIcon}
                  />
                  Afficher l'annexe
                </>
              ) : (
                <>
                  <Icone className="w-3 h-3 text-current" icone={AddLineIcon} />
                  Ajouter une annexe
                </>
              )}
            </button>
          );
        }

        return (
          <div className="isolate z-0 flex flex-column gap-2">
            <span className="text-sm italic">Annexe (facultatif)</span>
            <EditeurRiche
              contenu={field.value || ""}
              editeurRef={editeurRef}
              estEnLectureSeule={readOnly}
              onBlur={autosave.onBlur}
              onChange={(value) => {
                field.onChange(value);
                autosave.onChange();
              }}
              onFocus={onFocus}
            />
            <div className="flex justify-end">
              {!readOnly && (
                <Bouton
                  label="Fermer l'annexe"
                  onClick={() => {
                    setDisplayAnnexe(false);
                  }}
                  type="button"
                  variant="link"
                />
              )}
            </div>
          </div>
        );
      }}
    />
  );
}
