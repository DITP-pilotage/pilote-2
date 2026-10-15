import {
  LIMITE_CARACTÈRES_COMMENTAIRE,
  validationCommentaireFormulaire,
} from "@/validation/commentaire";
import {
  PublicationFormConfig,
  Publication,
  PublicationBrouillon,
  PublicationValues,
} from "./Publication.interface";

export const commentaireForm = ({
  publication,
  brouillon,
}: {
  publication: Publication | null;
  brouillon: PublicationBrouillon | null;
}): PublicationFormConfig<PublicationValues> => ({
  draftSchema: validationCommentaireFormulaire,
  publishSchema: validationCommentaireFormulaire,
  maxLength: LIMITE_CARACTÈRES_COMMENTAIRE,
  conditionLabels: {
    contenu: `Saisir le commentaire (${LIMITE_CARACTÈRES_COMMENTAIRE} caractères max.)`,
  },
  editValues: { contenu: publication?.contenu ?? "" },
  newValues: { contenu: brouillon?.contenu ?? "" },
});
