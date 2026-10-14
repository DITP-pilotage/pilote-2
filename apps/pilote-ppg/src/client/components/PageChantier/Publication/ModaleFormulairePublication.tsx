import { ReactNode, useRef } from "react";
import { Button } from "@/components/shared/Button";
import {
  FormProvider,
  Path,
  Resolver,
  SubmitHandler,
  useForm,
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

  // Les règles de validation suivent la dernière action tentée : après un
  // clic sur « Publier », les erreurs de publication restent affichées
  // jusqu'à leur correction.
  const intention = useRef<"publier" | "brouillon">("brouillon");
  const resolver: Resolver<T> = (values, context, options) =>
    intention.current === "publier"
      ? zodResolver(formConfig.publishSchema)(values, context, options)
      : zodResolver(formConfig.draftSchema)(values, context, options);

  const form = useForm<T>({
    mode: "all",
    resolver,
    defaultValues: formConfig.newValues,
  });

  const publier = (data: T) => {
    const resultat = formConfig.publishSchema.safeParse(data);
    if (!resultat.success) {
      resultat.error.issues.forEach((issue, index) =>
        form.setError(
          issue.path.join(".") as Path<T>,
          { message: issue.message },
          { shouldFocus: index === 0 },
        ),
      );
      return;
    }
    return onPublier(resultat.data);
  };

  return (
    <Modale
      onOpenChange={onOpenChange}
      open={open}
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
        <form onSubmit={form.handleSubmit(publier)}>
          <PublicationFormFields
            contentLabel={formConfig.contentLabel}
            extraFields={formConfig.extraFields}
            editorClassName={formConfig.extraFields ? undefined : "h-60"}
            maxLength={formConfig.maxLength}
          />
          <div className="flex justify-end items-center gap-3 mt-6">
            <Button
              iconLeft={
                <Icone className="w-4 h-4 text-current" icone={SuccessIcon} />
              }
              onClick={() => {
                intention.current = "publier";
              }}
              type="submit"
              variant="primary"
            >
              Publier
            </Button>
            <Button
              iconLeft={<Icone className="w-4 h-4" icone={ArrowGoBack1Icon} />}
              onClick={() => onOpenChange(false)}
              type="button"
              variant="secondary"
            >
              Annuler
            </Button>
            <Button
              variant="link"
              iconLeft={
                <Icone className="w-4 h-4 text-current" icone={SaveIcon} />
              }
              onClick={(event) => {
                intention.current = "brouillon";
                return form.handleSubmit(onEnregistrerBrouillon)(event);
              }}
              type="button"
            >
              Enregistrer en tant que brouillon
            </Button>
          </div>
        </form>
      </FormProvider>
    </Modale>
  );
};
