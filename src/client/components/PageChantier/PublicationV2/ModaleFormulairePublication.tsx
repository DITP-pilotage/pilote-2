import { ReactNode } from "react";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Bouton } from "@/components/_commons/Bouton/Bouton";
import { Icone } from "@/components/_commons/Icone";
import { SuccessIcon } from "@/components/_commons/Icones/SuccessIcon";
import { ArrowGoBack1Icon } from "@/components/_commons/Icones/ArrowGoBack1Icon";
import { Modale } from "@/components/shared/Modale";
import { BoutonSousLigné } from "@/components/_commons/BoutonSousLigné/BoutonSousLigné";
import { SaveIcon } from "@/components/_commons/Icones/SaveIcon";
import CompteurCaractères from "@/components/_commons/CompteurCaractères/CompteurCaractères";
import {
  LIMITE_CARACTÈRES_COMMENTAIRE,
  validationCommentaireFormulaire,
} from "@/validation/commentaire";
import { AffichagePublication } from "@/components/PageChantier/PublicationV2/Affichage/AffichagePublication";
import {
  pageChantier,
  useTerritoireSelectionne,
} from "@/components/PageChantier/PageChantierServerSideContext";
import {
  PublicationBrouillon,
  Publication,
} from "@/components/PageChantier/PublicationV2/Publication.interface";
import { useEnv } from "@/client/hooks/useEnv";
import { EditeurSimple } from "@/components/_commons/EditeurRiche/EditeurSimple";
import { extractVisibleText } from "@/client/utils/html/extractVisibleText";
import { plainTextToHtml } from "@/client/utils/html/plainTextToHtml";

interface ModaleFormulairePublicationProps {
  title: string;
  consigne: string;
  complementConsigneGenerique: string;
  trigger: ReactNode;
  open: boolean;
  onOpenChange: (isOpen: boolean) => void;
  commentaire: Publication | null;
  brouillon?: PublicationBrouillon | null;
  onPublier: SubmitHandler<{ contenu: string }>;
  onEnregistrerBrouillon: SubmitHandler<{ contenu: string }>;
}

export const ModaleFormulairePublication = ({
  title,
  consigne,
  complementConsigneGenerique,
  trigger,
  open,
  onOpenChange,
  commentaire,
  brouillon,
  onPublier,
  onEnregistrerBrouillon,
}: ModaleFormulairePublicationProps) => {
  const { chantierInformations } = pageChantier.useServerSidePropsContext();
  const territoireSélectionné = useTerritoireSelectionne();
  const ffEditeurRicheCommentaires = useEnv(
    "NEXT_PUBLIC_FF_EDITEUR_RICHE_COMMENTAIRES",
  );

  const form = useForm<{ contenu: string }>({
    mode: "all",
    resolver: zodResolver(validationCommentaireFormulaire),
    defaultValues: {
      contenu: brouillon?.contenuHtml ?? brouillon?.contenu ?? "",
    },
  });

  const avecConversionHtml =
    (handler: SubmitHandler<{ contenu: string }>): SubmitHandler<{ contenu: string }> =>
    (data) =>
      handler({
        contenu: ffEditeurRicheCommentaires
          ? data.contenu
          : plainTextToHtml(data.contenu),
      });

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
        <AffichagePublication commentaire={commentaire} />
      </div>

      <h3 className="text-base font-bold mb-3">Votre nouveau commentaire</h3>
      <p className="text-sm mb-6">{consigne}</p>
      <form onSubmit={form.handleSubmit(avecConversionHtml(onPublier))}>
        <div
          className={`flex flex-col ${form.formState.errors.contenu ? "fr-input-group--error" : ""}`}
        >
          {ffEditeurRicheCommentaires ? (
            <Controller
              control={form.control}
              name="contenu"
              render={({ field }) => (
                <EditeurSimple
                  contenu={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                />
              )}
            />
          ) : (
            <textarea
              className="fr-input fr-text--sm flex-1 mb-0"
              rows={6}
              {...form.register("contenu")}
            />
          )}
          <div className="flex justify-between mt-1">
            <div>
              {!!form.formState.errors.contenu && (
                <p className="fr-error-text mt-0">
                  {form.formState.errors.contenu.message}
                </p>
              )}
            </div>
            <CompteurCaractères
              compte={extractVisibleText(form.watch("contenu") ?? "").length}
              limiteDeCaractères={LIMITE_CARACTÈRES_COMMENTAIRE}
            />
          </div>
        </div>
        <div className="flex justify-end items-center gap-3 mt-6">
          <Bouton
            disabled={!form.formState.isValid}
            iconLeft={
              <Icone className="w-4 h-4 text-current" icone={SuccessIcon} />
            }
            label="Publier"
            type="submit"
            variant="primary"
          />
          <Bouton
            iconLeft={<Icone className="w-4 h-4" icone={ArrowGoBack1Icon} />}
            label="Annuler"
            onClick={() => onOpenChange(false)}
            type="button"
            variant="secondary"
          />
          <BoutonSousLigné
            disabled={!form.formState.isValid}
            iconLeft={
              <Icone className="w-4 h-4 text-current" icone={SaveIcon} />
            }
            onClick={form.handleSubmit(avecConversionHtml(onEnregistrerBrouillon))}
            type="button"
          >
            Enregistrer en tant que brouillon
          </BoutonSousLigné>
        </div>
      </form>
    </Modale>
  );
};
