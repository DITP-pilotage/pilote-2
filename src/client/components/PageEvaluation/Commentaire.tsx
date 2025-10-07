import { useState } from "react";
import { Controller } from "react-hook-form";
import { useFormEvaluation } from "@/components/PageEvaluation/form";
import { Icone } from "@/components/_commons/Icone";
import { AddLineIcon } from "@/components/_commons/Icones/AddLineIcon";

export function Commentaire({
  name,
}: {
  name:
    | `criteres.${number}.sousCriteres.${number}.commentaire`
    | `objectifs.${number}.commentaire`;
}) {
  const [displayComment, setDisplayComment] = useState(false);
  const form = useFormEvaluation();

  if (!displayComment) {
    return (
      <button
        className="-ml-4 !text-xs !text-dsfr-grey-200 inline-flex w-fit gap-1 items-center"
        onClick={() => setDisplayComment(true)}
        type="button"
      >
        <Icone className="w-3 h-3 text-current" icone={AddLineIcon} /> Ajouter
        un commentaire
      </button>
    );
  }

  return (
    <Controller
      control={form.control}
      name={name}
      render={({ field }) => {
        const fieldId = `${name}.commentaire`;
        return (
          <div className="flex flex-col gap-1">
            <label className="font-bold text-sm" htmlFor={fieldId}>
              Commentaire
            </label>
            <textarea
              className="border !rounded-md !bg-white py-2 px-4"
              id={fieldId}
              {...field}
            />
          </div>
        );
      }}
    />
  );
}
