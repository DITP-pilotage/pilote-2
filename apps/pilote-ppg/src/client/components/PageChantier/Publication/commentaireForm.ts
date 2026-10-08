import { zodResolver } from "@hookform/resolvers/zod";
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
  resolver: zodResolver(validationCommentaireFormulaire),
  maxLength: LIMITE_CARACTÈRES_COMMENTAIRE,
  editValues: { contenu: publication?.contenu ?? "" },
  newValues: { contenu: brouillon?.contenu ?? "" },
});
