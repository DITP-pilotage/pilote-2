import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { FunctionComponent } from "react";
import {
  CommentaireAvecNomsAuteurs,
  TypeCommentaireChantier,
} from "@/server/domain/chantier/commentaire/Commentaire.interface";
import { Maille } from "@/server/domain/maille/Maille.interface";
import CompteurCaractères from "@/components/_commons/CompteurCaractères/CompteurCaractères";
import Titre from "@/components/_commons/Titre/Titre";
import {
  LIMITE_CARACTÈRES_COMMENTAIRE,
  validationCommentaireFormulaire,
} from "@/validation/commentaire";
import { formaterDate } from "@/client/utils/date/date";
import { Icone } from "@/components/_commons/Icone";
import { SuccessIcon } from "@/components/_commons/Icones/SuccessIcon";
import { ArrowGoBack1Icon } from "@/components/_commons/Icones/ArrowGoBack1Icon";
import { Bouton } from "@/components/_commons/Bouton/Bouton";
import { useModifierCommentaire } from "./useModifierCommentaire";

interface CommentaireFormulaireProps {
  commentaire: CommentaireAvecNomsAuteurs | null;
  type: TypeCommentaireChantier;
  réformeId: string;
  territoireCode: string;
  maille: Maille;
  annulationCallback?: () => void;
}

const CommentaireFormulaire: FunctionComponent<CommentaireFormulaireProps> = ({
  commentaire,
  type,
  annulationCallback,
}) => {
  const modifierCommentaire = useModifierCommentaire({
    commentaire: commentaire!,
    type,
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
  } = useForm<{ contenu: string }>({
    mode: "all",
    resolver: zodResolver(validationCommentaireFormulaire),
    defaultValues: { contenu: commentaire?.contenu ?? "" },
  });

  return (
    <form onSubmit={handleSubmit(modifierCommentaire)}>
      <Titre baliseHtml="h3" className="fr-h5 fr-mb-1v">
        Modifier le commentaire
      </Titre>
      <p className="fr-text--xs mb-4 text-dsfr-mention-grey">
        {`Vous pouvez apporter ci-dessous des modifications au commentaire que vous avez posté le ${formaterDate(commentaire?.dateModification, "DD/MM/YYYY")}. Après validation, le commentaire modifié annulera et remplacera le commentaire actuel.`}
      </p>
      <div
        className={`flex flex-col fr-mb-0 fr-input-group ${errors.contenu ? "fr-input-group--error" : ""}`}
      >
        <textarea
          className="fr-input fr-text--sm fr-mb-0"
          rows={6}
          {...register("contenu")}
        />
        <div className="flex justify-between">
          <div>
            {!!errors.contenu && (
              <p className="fr-error-text fr-mt-0 fr-mr-2w">
                {errors.contenu.message}
              </p>
            )}
          </div>
          <CompteurCaractères
            compte={watch("contenu")?.length ?? 0}
            limiteDeCaractères={LIMITE_CARACTÈRES_COMMENTAIRE}
          />
        </div>
      </div>
      <div className="flex justify-end fr-mt-2w">
        <Bouton
          className="mr-3"
          disabled={!isValid}
          iconLeft={
            <Icone className="w-4 h-4 text-current" icone={SuccessIcon} />
          }
          label="Valider"
          type="submit"
          variant="primary"
        />
        <Bouton
          iconLeft={<Icone className="w-4 h-4" icone={ArrowGoBack1Icon} />}
          label="Annuler"
          onClick={annulationCallback}
          variant="secondary"
        />
      </div>
    </form>
  );
};

export default CommentaireFormulaire;
