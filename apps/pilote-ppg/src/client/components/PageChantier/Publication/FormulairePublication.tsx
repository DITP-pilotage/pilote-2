import {
  FormProvider,
  SubmitHandler,
  useForm,
  useWatch,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/shared/Button";
import { Icone } from "@/components/_commons/Icone";
import { SuccessIcon } from "@/components/_commons/Icones/SuccessIcon";
import { ArrowGoBack1Icon } from "@/components/_commons/Icones/ArrowGoBack1Icon";
import { PiloteDateFormatter } from "@/utils/PiloteDateFormatter";
import { Infobulle } from "@/components/shared/Infobulle";
import {
  PublicationFormConfig,
  Publication,
  PublicationValues,
} from "@/components/PageChantier/Publication/Publication.interface";
import { PublicationFormFields } from "@/components/PageChantier/Publication/PublicationFormFields";
import { MotifsTooltip } from "@/components/PageChantier/Publication/MotifsTooltip";
import { motifsBloquants } from "@/components/PageChantier/Publication/motifsActionsIndisponibles";

interface FormulairePublicationProps<T extends PublicationValues, P extends T> {
  publication: Publication | null;
  libelle: string;
  consigne: string;
  formConfig: PublicationFormConfig<T, P>;
  annulationCallback?: () => void;
  onModifier: SubmitHandler<P>;
}

export const FormulairePublication = <
  T extends PublicationValues,
  P extends T = T,
>({
  publication,
  libelle,
  consigne,
  formConfig,
  annulationCallback,
  onModifier,
}: FormulairePublicationProps<T, P>) => {
  const form = useForm<T, unknown, P>({
    mode: "all",
    resolver: zodResolver(formConfig.publishSchema),
    defaultValues: formConfig.editValues,
  });
  const values = useWatch({ control: form.control });
  const motifs = motifsBloquants(formConfig.publishSchema, values);

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onModifier)}>
        <div className="flex items-center gap-2 mb-1">
          <h3 className="text-xl mb-0">
            {`Modifier le commentaire "${libelle}"`}
          </h3>
          <Infobulle classNameIcone="w-5 h-5">{consigne}</Infobulle>
        </div>
        {publication ? (
          <p className="text-xs print:text-base mb-4 text-dsfr-mention-grey">
            {`Vous pouvez apporter ci-dessous des modifications au commentaire que vous avez posté le ${PiloteDateFormatter.isoDateFranceMetropolitaine(publication.dateModification)}. Après validation, le commentaire modifié annulera et remplacera le commentaire actuel.`}
          </p>
        ) : null}
        <PublicationFormFields
          contentLabel={formConfig.contentLabel}
          extraFields={formConfig.extraFields}
          maxLength={formConfig.maxLength}
        />
        <div className="flex justify-end mt-4">
          <MotifsTooltip motifs={motifs}>
            <Button
              aria-disabled={motifs.length > 0 || undefined}
              className="mr-3"
              iconLeft={
                <Icone className="w-4 h-4 text-current" icone={SuccessIcon} />
              }
              type="submit"
              variant="primary"
            >
              Valider
            </Button>
          </MotifsTooltip>
          <Button
            iconLeft={<Icone className="w-4 h-4" icone={ArrowGoBack1Icon} />}
            onClick={annulationCallback}
            variant="secondary"
          >
            Annuler
          </Button>
        </div>
      </form>
    </FormProvider>
  );
};
