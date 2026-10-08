import { FormProvider, SubmitHandler, useForm } from "react-hook-form";
import { Button } from "@/components/shared/Button";
import Titre from "@/components/_commons/Titre/Titre";
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

interface FormulairePublicationProps<T extends PublicationValues> {
  publication: Publication | null;
  libelle: string;
  consigne: string;
  formConfig: PublicationFormConfig<T>;
  annulationCallback?: () => void;
  onModifier: SubmitHandler<T>;
}

export const FormulairePublication = <T extends PublicationValues>({
  publication,
  libelle,
  consigne,
  formConfig,
  annulationCallback,
  onModifier,
}: FormulairePublicationProps<T>) => {
  const form = useForm<T>({
    mode: "all",
    resolver: formConfig.resolver,
    defaultValues: formConfig.editValues,
  });

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onModifier)}>
        <div className="flex items-center gap-2 fr-mb-1v">
          <Titre baliseHtml="h3" className="text-xl mb-0">
            {`Modifier le commentaire "${libelle}"`}
          </Titre>
          <Infobulle classNameIcone="w-5 h-5">{consigne}</Infobulle>
        </div>
        {publication ? (
          <p className="fr-text--xs mb-4 text-dsfr-mention-grey">
            {`Vous pouvez apporter ci-dessous des modifications au commentaire que vous avez posté le ${PiloteDateFormatter.isoDateFranceMetropolitaine(publication.dateModification)}. Après validation, le commentaire modifié annulera et remplacera le commentaire actuel.`}
          </p>
        ) : null}
        <PublicationFormFields
          extraFields={formConfig.extraFields}
          maxLength={formConfig.maxLength}
        />
        <div className="flex justify-end fr-mt-2w">
          <Button
            className="mr-3"
            disabled={!form.formState.isValid}
            iconLeft={
              <Icone className="w-4 h-4 text-current" icone={SuccessIcon} />
            }
            type="submit"
            variant="primary"
          >
            Valider
          </Button>
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
