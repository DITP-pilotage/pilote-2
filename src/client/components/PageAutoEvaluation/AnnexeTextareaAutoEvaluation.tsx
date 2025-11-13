import { useState } from "react";
import { flushSync } from "react-dom";
import { Control, Controller, FieldValues, Path } from "react-hook-form";
import { Icone } from "@/components/_commons/Icone";
import { AddLineIcon } from "@/components/_commons/Icones/AddLineIcon";
import { EditeurRiche } from "@/components/_commons/ÉditeurRiche/EditeurRiche";

export function AnnexeTextareaAutoEvaluation<T extends FieldValues>({
  name,
  readOnly,
  control,
  defaultOpen,
}: {
  name: Path<T>;
  readOnly: boolean;
  defaultOpen: boolean;
  control: Control<T>;
}) {
  const [displayAnnexe, setDisplayAnnexe] = useState(defaultOpen);

  if (!displayAnnexe) {
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
        <Icone className="w-3 h-3 text-current" icone={AddLineIcon} /> Ajouter
        une annexe
      </button>
    );
  }

  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <>
          <span className="bold">Annexe</span>
          <EditeurRiche
            contenu={field.value || ""}
            estEnLectureSeule={readOnly}
            onChange={field.onChange}
          />
        </>
      )}
    />
  );
}
