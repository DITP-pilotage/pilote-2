import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Objectif } from "@/server/evaluation/queries/types";
import { Textarea } from "@/components/_commons/Textarea";
import { useAutosave } from "@/components/Evaluation/useAutosave";
import api from "@/server/infrastructure/api/trpc/api";
import { Infobulle } from "@/client/components/_commons/Infobulle/Infobulle";
import { useRefreshRouter } from "@/client/hooks/useRefreshRouter";

const formSchema = z.object({
  descriptif: z
    .string()
    .max(600, "Ce champ ne doit pas dépasser 600 caractères."),
  indicateurCible: z
    .string()
    .max(600, "Ce champ ne doit pas dépasser 600 caractères."),
});

type FormValues = z.infer<typeof formSchema>;

export const FicheCadrageObjectif = ({
  editable,
  objectif,
}: {
  editable: boolean;
  objectif: Omit<Objectif, "evaluations"> & { ficheEvaluationId: string };
}) => {
  const mutation = api.evaluation.modifierObjectif.useMutation();
  const refreshRouter = useRefreshRouter();

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
    await refreshRouter();
  });

  const autosave = useAutosave({
    onAutosave: handleSubmit,
  });

  const onBlur = async () => {
    const isValid = await form.trigger();
    if (!isValid) return;
    autosave.onBlur();
  };

  const descriptifActuel = form.watch("descriptif");
  const indicateurCibleActuel = form.watch("indicateurCible");

  const ficheCadrageACompleter =
    !descriptifActuel ||
    descriptifActuel.trim() === "" ||
    !indicateurCibleActuel ||
    indicateurCibleActuel.trim() === "";

  return (
    <div>
      <h2 className="!text-xl !text-dsfr-blue-france-sun-113 !mb-2">
        {objectif.libelle}
      </h2>
      {ficheCadrageACompleter ? (
        <span className="flex items-center w-fit pr-2 py-1.5 rounded text-xs text-dsfr-warning-425 bg-dsfr-warning-950 font-bold">
          <Infobulle
            classNameBouton="!text-dsfr-warning-425 !fr-btn-sm"
            classNameIcone="h-4 w-4"
            styleIconInfoBulle="warning"
          >
            Éditez la fiche de cadrage afin de compléter le descriptif de
            l'objectif et les critères d'évaluation associés (indicateur +
            cible).{" "}
          </Infobulle>
          COMPLETER LA FICHE DE CADRAGE
        </span>
      ) : null}

      {editable ? (
        <form className="space-y-4 mt-6">
          <div>
            <Textarea
              charLimit={600}
              className="max-h-[400px] overflow-y-auto !bg-dsfr-contrast-grey"
              control={form.control}
              label="Descriptif de l'objectif"
              name="descriptif"
              onBlur={onBlur}
              onChange={autosave.onChange}
              placeholder="Merci de compléter la fiche de cadrage de cet objectif."
            />
          </div>
          <div>
            <Textarea
              charLimit={600}
              className="max-h-[400px] overflow-y-auto !bg-dsfr-contrast-grey"
              control={form.control}
              label="Indicateur(s) et cible(s) associé(s)"
              name="indicateurCible"
              onBlur={onBlur}
              onChange={autosave.onChange}
              placeholder="Merci de compléter la fiche de cadrage de cet objectif."
            />
          </div>
        </form>
      ) : (
        <>
          <h3 className="!text-lg !mb-1">Descriptif</h3>
          <p className="whitespace-pre-line">{objectif.descriptif}</p>

          <h3 className="!text-lg !mb-1">Indicateur + cible</h3>
          <p className="whitespace-pre-line">{objectif.indicateurCible}</p>
        </>
      )}
    </div>
  );
};
