import { zodResolver } from "@hookform/resolvers/zod";
import {
  LIMITE_CARACTÈRES_COMMENTAIRE,
  validationCommentaireFormulaire,
} from "@/validation/commentaire";
import {
  FormulairePublicationConfiguration,
  Publication,
  PublicationBrouillon,
  ValeursPublication,
} from "./Publication.interface";

export const formulaireCommentaire = ({
  publication,
  brouillon,
}: {
  publication: Publication | null;
  brouillon: PublicationBrouillon | null;
}): FormulairePublicationConfiguration<ValeursPublication> => ({
  resolver: zodResolver(validationCommentaireFormulaire),
  limiteCaracteres: LIMITE_CARACTÈRES_COMMENTAIRE,
  valeursModification: { contenu: publication?.contenu ?? "" },
  valeursNouvellePublication: { contenu: brouillon?.contenu ?? "" },
});
