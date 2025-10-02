import { Controller, useFieldArray } from "react-hook-form";
import { useId, useState } from "react";
import { useFormEvaluation } from "@/components/PageEvaluation/form";
import { clsxm } from "@/utils/clsxm";
import { pageEvaluation } from "@/components/PageEvaluation/PageEvaluationServerSideContext";
import { Icone } from "@/components/_commons/Icone";
import { IconeIcon } from "@/components/_commons/Icones/IconeIcon";
import { AddLineIcon } from "@/components/_commons/Icones/AddLineIcon";

export const EtapeCriteres = () => {
  const { autoEvaluation } = pageEvaluation.useServerSidePropsContext();
  const form = useFormEvaluation();
  const baseId = useId();
  const { fields } = useFieldArray({ control: form.control, name: "criteres" });

  return (
    <div>
      {fields.map((fieldCritere, index) => {
        const critere = autoEvaluation.criteres[index];
        return (
          <div key={critere.id}>
            <header className="py-6 px-4 text-primary font-bold border-t-1 !border-primary">
              {critere.nom}
            </header>
            <div className="bg-dsfr-grey-925/30 divide-y divide-gray-200">
              {fieldCritere.sousCriteres.map((subField, j) => {
                const sousCritere = critere.sousCriteres[j];
                const noteInputName =
                  `criteres.${index}.sousCriteres.${j}.note` as const;
                const commentaireInputName =
                  `criteres.${index}.sousCriteres.${j}.commentaire` as const;

                return (
                  <div className="py-6 px-6 flex flex-col" key={sousCritere.id}>
                    <div className="flex items-center">
                      <span className="text-primary grow">
                        {sousCritere.nom}
                      </span>
                      <Controller
                        control={form.control}
                        name={noteInputName}
                        render={({ field, fieldState }) => (
                          <input
                            className={clsxm(
                              "border !rounded-md !bg-white w-14 aspect-square text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
                              {
                                "!border-dsfr-error-425":
                                  fieldState.error != null,
                              },
                            )}
                            type="number"
                            {...field}
                            onChange={(e) =>
                              field.onChange(e.target.valueAsNumber)
                            }
                          />
                        )}
                      />
                    </div>

                    <Commentaire />
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

function Commentaire() {
  const [dispalyComment, setDisplayCOmment] = useState(false);
  const commentaireInputName = useId();
  const form = useFormEvaluation();

  if (!dispalyComment) {
    return (
      <button
        className="-ml-4 !text-xs !text-dsfr-grey-200 inline-flex gap-1 items-center"
        onClick={() => setDisplayCOmment(true)}
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
      name={commentaireInputName}
      render={({ field }) => {
        const fieldId = `${commentaireInputName}.commentaire`;
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
