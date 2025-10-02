import { Controller, useFieldArray } from "react-hook-form";
import { useFormEvaluation } from "@/components/PageEvaluation/form";

export interface Objectif {
  id: string;
  nom: string;
  evaluation: {
    note: number;
    commentaire: string;
  };
}

export function EtapeObjectifs({ objectifs }: { objectifs: Objectif[] }) {
  const form = useFormEvaluation();
  const { fields } = useFieldArray({
    control: form.control,
    name: "objectifs",
  });
  return (
    <div className="divide-y divide-gray-100">
      {fields.map((fieldObjectif, index) => {
        const objectif = objectifs[index];
        const noteName = `objectifs.${index}.note` as const;
        return (
          <div className="py-6 px-4 flex justify-between" key={objectif.id}>
            <span className="text-primary font-bold">{objectif.nom}</span>
            <Controller
              control={form.control}
              name={noteName}
              render={({ field }) => (
                <input
                  className="border !rounded-md !bg-white w-14 aspect-square text-center"
                  type="number"
                  {...field}
                  onChange={(e) => field.onChange(e.target.valueAsNumber)}
                />
              )}
            />
          </div>
        );
      })}
    </div>
  );
}
