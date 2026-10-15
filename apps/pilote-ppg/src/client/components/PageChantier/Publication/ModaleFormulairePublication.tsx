import { ReactNode, useId } from "react";
import { Button } from "@/components/shared/Button";
import {
  FormProvider,
  SubmitHandler,
  useForm,
  useWatch,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Icone } from "@/components/_commons/Icone";
import { SuccessIcon } from "@/components/_commons/Icones/SuccessIcon";
import { ArrowGoBack1Icon } from "@/components/_commons/Icones/ArrowGoBack1Icon";
import { Modale } from "@/components/shared/Modale";
import { SaveIcon } from "@/components/_commons/Icones/SaveIcon";
import { AffichagePublication } from "@/components/PageChantier/Publication/Affichage/AffichagePublication";
import {
  pageChantier,
  useTerritoireSelectionne,
} from "@/components/PageChantier/PageChantierServerSideContext";
import {
  PublicationFormConfig,
  Publication,
  PublicationValues,
} from "@/components/PageChantier/Publication/Publication.interface";
import { PublicationFormFields } from "@/components/PageChantier/Publication/PublicationFormFields";
import { ConditionsChecklist } from "@/components/PageChantier/Publication/ConditionsChecklist";
import {
  actionConditions,
  allConditionsMet,
} from "@/components/PageChantier/Publication/actionConditions";

interface ModaleFormulairePublicationProps<
  T extends PublicationValues,
  P extends T,
> {
  title: string;
  consigne: string;
  complementConsigneGenerique: string;
  trigger: ReactNode;
  open: boolean;
  onOpenChange: (isOpen: boolean) => void;
  commentaire: Publication | null;
  aside?: ReactNode;
  emptyMessage?: string;
  formConfig: PublicationFormConfig<T, P>;
  onPublier: SubmitHandler<P>;
  onEnregistrerBrouillon: SubmitHandler<T>;
}

export const ModaleFormulairePublication = <
  T extends PublicationValues,
  P extends T = T,
>({
  title,
  consigne,
  complementConsigneGenerique,
  trigger,
  open,
  onOpenChange,
  commentaire,
  aside,
  emptyMessage,
  formConfig,
  onPublier,
  onEnregistrerBrouillon,
}: ModaleFormulairePublicationProps<T, P>) => {
  const { chantierInformations } = pageChantier.useServerSidePropsContext();
  const territoireSélectionné = useTerritoireSelectionne();

  const form = useForm<T>({
    resolver: zodResolver(formConfig.draftSchema),
    defaultValues: formConfig.newValues,
  });
  const values = useWatch({ control: form.control });
  const publishConditions = actionConditions(
    formConfig.publishSchema,
    values,
    formConfig.conditionLabels,
  );
  const draftConditions = actionConditions(
    formConfig.draftSchema,
    values,
    formConfig.conditionLabels,
  );
  const publishConditionsId = useId();
  const draftConditionsId = useId();

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      form.reset(formConfig.newValues);
    }
    onOpenChange(isOpen);
  };

  return (
    <Modale
      onOpenChange={handleOpenChange}
      open={open}
      size="full"
      title={title}
      titleClassName="text-dsfr-grey-50"
      trigger={trigger}
    >
      <p className="text-sm mb-0">
        {chantierInformations.id} {chantierInformations.nom}
      </p>
      <p className="text-sm">{territoireSélectionné.nomAffiché}</p>
      <p className="text-sm text-dsfr-mention-grey mb-6">
        {`Veuillez saisir ci-dessous le nouveau commentaire relatif ${complementConsigneGenerique}. Après publication, le nouveau commentaire sera affiché et l'ancien sera archivé dans l'historique.`}
      </p>
      <h3 className="text-base font-bold mb-3">Commentaire actuel</h3>
      <div className="mb-6">
        <AffichagePublication
          aside={aside}
          commentaire={commentaire}
          emptyMessage={emptyMessage}
        />
      </div>

      <h3 className="text-base font-bold mb-3">Votre nouveau commentaire</h3>
      <p className="text-sm mb-6">{consigne}</p>
      <FormProvider {...form}>
        <form
          onSubmit={form.handleSubmit((data) =>
            onPublier(formConfig.publishSchema.parse(data)),
          )}
        >
          <PublicationFormFields
            contentLabel={formConfig.contentLabel}
            extraFields={formConfig.extraFields}
            editorClassName={formConfig.extraFields ? undefined : "h-60"}
            maxLength={formConfig.maxLength}
          />
          <div className="flex items-center justify-between gap-6 mt-6">
            <div className="flex flex-1 min-w-0 flex-wrap gap-x-6 gap-y-2">
              <ConditionsChecklist
                conditions={publishConditions}
                id={publishConditionsId}
                title="Pour publier :"
              />
              <ConditionsChecklist
                conditions={draftConditions}
                id={draftConditionsId}
                title="Pour enregistrer en brouillon :"
              />
            </div>
            <div className="flex flex-none items-center gap-3 ml-auto whitespace-nowrap">
              <Button
                aria-describedby={publishConditionsId}
                disabled={!allConditionsMet(publishConditions)}
                iconLeft={
                  <Icone className="w-4 h-4 text-current" icone={SuccessIcon} />
                }
                type="submit"
                variant="primary"
              >
                Publier
              </Button>
              <Button
                iconLeft={
                  <Icone className="w-4 h-4" icone={ArrowGoBack1Icon} />
                }
                onClick={() => onOpenChange(false)}
                type="button"
                variant="secondary"
              >
                Annuler
              </Button>
              <Button
                aria-describedby={draftConditionsId}
                disabled={!allConditionsMet(draftConditions)}
                variant="link"
                iconLeft={
                  <Icone className="w-4 h-4 text-current" icone={SaveIcon} />
                }
                onClick={(event) => {
                  return form.handleSubmit(onEnregistrerBrouillon)(event);
                }}
                type="button"
              >
                Enregistrer en tant que brouillon
              </Button>
            </div>
          </div>
        </form>
      </FormProvider>
    </Modale>
  );
};
