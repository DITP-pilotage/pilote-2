import { FunctionComponent, PropsWithChildren, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Bouton } from "@/components/_commons/Bouton/Bouton";
import { Icone } from "@/components/_commons/Icone";
import { SuccessIcon } from "@/components/_commons/Icones/SuccessIcon";
import { ArrowGoBack1Icon } from "@/components/_commons/Icones/ArrowGoBack1Icon";
import { Modale } from "@/components/shared/Modale";
import { BoutonSousLigné } from "@/components/_commons/BoutonSousLigné/BoutonSousLigné";
import { SaveIcon } from "@/components/_commons/Icones/SaveIcon";
import CompteurCaractères from "@/components/_commons/CompteurCaractères/CompteurCaractères";
import { useRefreshRouter } from "@/client/hooks/useRefreshRouter";
import {
  CommentaireAvecNomsAuteurs,
  TypeCommentaireChantier,
} from "@/server/domain/chantier/commentaire/Commentaire.interface";
import { Maille } from "@/server/domain/maille/Maille.interface";
import {
  LIMITE_CARACTÈRES_COMMENTAIRE,
  validationCommentaireFormulaire,
} from "@/validation/commentaire";
import api from "@/server/infrastructure/api/trpc/api";
import AffichageCommentaire from "@/components/_commons/CommentairesNew/CommentaireSection/Affichage/Affichage";
import { useEditerBrouillonCommentaire } from "./useEditerBrouillonCommentaire";

export const ModaleEditerBrouillonCommentaire: FunctionComponent<
  PropsWithChildren<{
    commentaire: CommentaireAvecNomsAuteurs | null;
    réformeId: string;
    territoireCode: string;
    type: TypeCommentaireChantier;
    maille: Maille;
  }>
> = ({ children, commentaire, réformeId, territoireCode, type }) => {
  const [open, setOpen] = useState(false);
  const refreshRouter = useRefreshRouter();

  const { data: brouillon } =
    api.commentaire.recupererDernierBrouillon.useQuery(
      { réformeId, territoireCode, type },
      { enabled: open },
    );

  const { publier, enregistrerEnBrouillon } = useEditerBrouillonCommentaire({
    brouillon: brouillon!,
    type,
    onSuccess: () => {
      setOpen(false);
      refreshRouter();
    },
  });

  const form = useForm<{ contenu: string }>({
    mode: "all",
    resolver: zodResolver(validationCommentaireFormulaire),
    values: brouillon ? { contenu: brouillon.contenu } : undefined,
  });

  return (
    <Modale
      onOpenChange={(isOpen) => setOpen(isOpen)}
      open={open}
      title="Editer un brouillon"
      trigger={children}
    >
      <p className="text-sm text-dsfr-mention-grey mb-6">
        Veuillez saisir ci-dessous le nouveau commentaire. Après publication, le
        nouveau commentaire sera affiché et l'ancien sera archivé dans
        l'historique.
      </p>

      <h3 className="text-base font-bold mb-3">Commentaire actuel</h3>
      <div className="mb-6">
        <AffichageCommentaire commentaire={commentaire} />
      </div>

      <h3 className="text-base font-bold mb-3">Votre nouveau commentaire</h3>
      {brouillon && (
        <form onSubmit={form.handleSubmit(publier)}>
          <div
            className={`flex flex-col ${form.formState.errors.contenu ? "fr-input-group--error" : ""}`}
          >
            <textarea
              className="fr-input fr-text--sm flex-1"
              rows={6}
              {...form.register("contenu")}
            />
            <div className="flex justify-between mt-1">
              <div>
                {!!form.formState.errors.contenu && (
                  <p className="fr-error-text mt-0">
                    {form.formState.errors.contenu.message}
                  </p>
                )}
              </div>
              <CompteurCaractères
                compte={form.watch("contenu")?.length ?? 0}
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
              onClick={() => setOpen(false)}
              type="button"
              variant="secondary"
            />
            <BoutonSousLigné
              disabled={!form.formState.isValid}
              iconLeft={
                <Icone className="w-4 h-4 text-current" icone={SaveIcon} />
              }
              onClick={form.handleSubmit(enregistrerEnBrouillon)}
              type="button"
            >
              Enregistrer en tant que brouillon
            </BoutonSousLigné>
          </div>
        </form>
      )}
    </Modale>
  );
};
