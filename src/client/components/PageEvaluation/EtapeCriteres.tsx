import { Controller, useFieldArray } from "react-hook-form";
import { useId } from "react";
import { useFormEvaluation } from "@/components/PageEvaluation/form";

export interface Critere {
  id: string;
  nom: string;
  sousCriteres: Array<{
    id: string;
    nom: string;
    evaluation: {
      note: number;
      commentaire: string;
    };
  }>;
}

export const EtapeCriteres = ({ criteres }: { criteres: Critere[] }) => {
  const form = useFormEvaluation();
  const baseId = useId();
  const { fields } = useFieldArray({ control: form.control, name: "criteres" });

  return (
    <div>
      {fields.map((fieldCritere, index) => {
        const critere = criteres[index];
        return (
          <div key={critere.id}>
            <header className="py-6 px-4 text-primary font-bold">
              {critere.nom}
            </header>
            <div className="bg-dsfr-grey-925/30">
              {fieldCritere.sousCriteres.map((subField, j) => {
                const sousCritere = critere.sousCriteres[j];
                const noteInputName =
                  `criteres.${index}.sousCriteres.${j}.note` as const;
                const commentaireInputName =
                  `criteres.${index}.sousCriteres.${j}.commentaire` as const;

                return (
                  <div
                    className="py-6 pr-4 pl-12 flex flex-col"
                    key={sousCritere.id}
                  >
                    <div className="flex items-center">
                      <span className="text-primary grow">
                        {sousCritere.nom}
                      </span>
                      <Controller
                        control={form.control}
                        name={noteInputName}
                        render={({ field }) => (
                          <input
                            className="border !rounded-md !bg-white w-14 aspect-square text-center"
                            type="number"
                            {...field}
                            onChange={(e) =>
                              field.onChange(e.target.valueAsNumber)
                            }
                          />
                        )}
                      />
                    </div>

                    <Controller
                      control={form.control}
                      name={commentaireInputName}
                      render={({ field }) => {
                        const fieldId = `${baseId}:commentaire`;
                        return (
                          <div className="flex flex-col gap-1 max-w-xl">
                            <label
                              className="font-bold text-sm"
                              htmlFor={fieldId}
                            >
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
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};
