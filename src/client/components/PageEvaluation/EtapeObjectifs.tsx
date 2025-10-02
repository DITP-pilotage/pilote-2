import { Controller, useFieldArray } from "react-hook-form";
import { useId } from "react";
import { useFormEvaluation } from "@/components/PageEvaluation/form";
import { clsxm } from "@/utils/clsxm";
import { pageEvaluation } from "@/components/PageEvaluation/PageEvaluationServerSideContext";

export function EtapeObjectifs() {
  const { autoEvaluation } = pageEvaluation.useServerSidePropsContext();
  const baseId = useId();
  const form = useFormEvaluation();
  const { fields } = useFieldArray({
    control: form.control,
    name: "objectifs",
  });
  return (
    <div className="divide-y divide-gray-100">
      {fields.map((fieldObjectif, index) => {
        const objectif = autoEvaluation.objectifs[index];
        const noteName = `objectifs.${index}.note` as const;
        const commentaireName = `objectifs.${index}.commentaire` as const;

        return (
          <div key={objectif.id}>
            <div className="p-4 flex items-center justify-between pr-6">
              <header className="text-primary font-bold">{objectif.nom}</header>
              <Controller
                control={form.control}
                name={noteName}
                render={({ field, fieldState }) => (
                  <input
                    className={clsxm(
                      "border !rounded-md !bg-white w-14 aspect-square text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
                      {
                        "!border-dsfr-error-425": fieldState.error != null,
                      },
                    )}
                    type="number"
                    {...field}
                    onChange={(e) => field.onChange(e.target.valueAsNumber)}
                    ref={(node) => {
                      if (index != 0) return;
                      node?.focus();
                    }}
                  />
                )}
              />
            </div>
            <div className="py-4 px-6 flex flex-col bg-dsfr-grey-925/30 ">
              <Controller
                control={form.control}
                name={commentaireName}
                render={({ field }) => {
                  const fieldId = `${baseId}.${index}.commentaire`;
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
            </div>
          </div>
        );
      })}
    </div>
  );
}
