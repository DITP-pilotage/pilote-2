import { FunctionComponent } from "react";
import Alerte from "@/components/_commons/Alerte/Alerte";
import { typeAlerte } from "@/components/_commons/Alerte/Alerte.interface";

export const COMMENTAIRE_ACTIONS = [
  "publication-reussie",
  "modification-reussie",
  "brouillon-enregistre",
] as const;

export type CommentaireAction = (typeof COMMENTAIRE_ACTIONS)[number];

const ALERTES: Record<
  CommentaireAction,
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
  action: CommentaireAction | null;
}> = ({ action }) => {
  if (!action) return null;

  const { message, type } = ALERTES[action];

  return (
    <div className="fr-mb-2w">
      <Alerte titre={message} type={type} />
    </div>
  );
};

export default AlerteCommentaire;
