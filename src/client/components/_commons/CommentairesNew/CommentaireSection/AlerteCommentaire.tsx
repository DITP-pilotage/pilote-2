import { FunctionComponent } from "react";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import Alerte from "@/components/_commons/Alerte/Alerte";
import { typeAlerte } from "@/components/_commons/Alerte/Alerte.interface";
import { TypeCommentaireChantier } from "@/server/domain/chantier/commentaire/Commentaire.interface";

export const COMMENTAIRE_ACTIONS = [
  "publication-reussie",
  "modification-reussie",
  "brouillon-enregistre",
  "",
] as const;

export type CommentaireAction = (typeof COMMENTAIRE_ACTIONS)[number];

const ALERTES: Record<
  Exclude<CommentaireAction, "">,
  { message: string; type: typeAlerte }
> = {
  "publication-reussie": {
    message: "Votre nouveau commentaire a bien été publié",
    type: "succès",
  },
  "modification-reussie": {
    message: "Votre commentaire a bien été modifié",
    type: "succès",
  },
  "brouillon-enregistre": {
    message:
      "Votre nouveau commentaire a bien été enregistré en tant que brouillon",
    type: "info",
  },
};

const AlerteCommentaire: FunctionComponent<{
  type: TypeCommentaireChantier;
}> = ({ type }) => {
  const [action] = useQueryState(
    `_action-${type}`,
    parseAsStringLiteral(COMMENTAIRE_ACTIONS),
  );

  if (!action || !(action in ALERTES)) return null;

  const { message, type: typeAlerte } = ALERTES[action as keyof typeof ALERTES];

  return (
    <div className="fr-mb-2w">
      <Alerte titre={message} type={typeAlerte} />
    </div>
  );
};

export default AlerteCommentaire;
