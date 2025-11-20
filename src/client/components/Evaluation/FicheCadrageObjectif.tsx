import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Objectif } from "@/server/evaluation/queries/types";
import { Textarea } from "@/components/_commons/Textarea";
import { useAutosave } from "@/components/Evaluation/useAutosave";
import api from "@/server/infrastructure/api/trpc/api";

const formSchema = z.object({
  descriptif: z.string(),
  indicateurCible: z.string(),
});

type FormValues = z.infer<typeof formSchema>;

export const FicheCadrageObjectif = ({
  objectif,
}: {
  objectif: Omit<Objectif, "evaluations"> & { ficheEvaluationId: string };
}) => {
  const mutation = api.evaluation.modifierObjectif.useMutation();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: {
      descriptif: objectif.descriptif,
      indicateurCible: objectif.indicateurCible,
    },
  });

  const handleSubmit = form.handleSubmit(async (values) => {
    await mutation.mutateAsync({
      ficheEvaluationId: objectif.ficheEvaluationId,
      objectifId: objectif.id,
      descriptif: values.descriptif,
      indicateurCible: values.indicateurCible,
    });
  });

  const { onChange, onBlur } = useAutosave({
    onAutosave: handleSubmit,
  });

  return (
    <div>
      <h2 className="!text-xl">{objectif.libelle}</h2>

      <form className="space-y-4">
        <div>
          <Textarea
            control={form.control}
            label="Descriptif"
            name="descriptif"
            onBlur={onBlur}
            onChange={onChange}
          />
        </div>

        <div>
          <Textarea
            control={form.control}
            label="Indicateur + cible"
            name="indicateurCible"
            onBlur={onBlur}
            onChange={onChange}
          />
        </div>
      </form>
    </div>
  );
};
