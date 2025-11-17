import { useState } from "react";
import { flushSync } from "react-dom";
import { Control, Controller, FieldValues, Path } from "react-hook-form";
import { Icone } from "@/components/_commons/Icone";
import { AddLineIcon } from "@/components/_commons/Icones/AddLineIcon";
import { EditeurRiche } from "@/components/_commons/ÉditeurRiche/EditeurRiche";
import { Bouton } from "@/components/_commons/Bouton/Bouton";
import { ChatForwardIcon } from "@/components/_commons/Icones/ChatForwardIcon";

export function AnnexeTextareaAutoEvaluation<T extends FieldValues>({
  name,
  readOnly,
  control,
}: {
  name: Path<T>;
  readOnly: boolean;
  control: Control<T>;
}) {
  const [displayAnnexe, setDisplayAnnexe] = useState(false);

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
              }}
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
          <div className="flex flex-column gap-2">
            <span className="bold">Annexe (facultatif)</span>
            <EditeurRiche
              contenu={field.value || ""}
              estEnLectureSeule={readOnly}
              onChange={field.onChange}
            />
            <div className="flex justify-end">
              {!readOnly && (
                <Bouton
                  label="Fermer l'annexe"
                  onClick={() => {
                    setDisplayAnnexe(false);
                  }}
                  type="button"
                />
              )}
            </div>
          </div>
        );
      }}
    />
  );
}
