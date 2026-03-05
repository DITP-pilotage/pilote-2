import { FunctionComponent } from "react";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import Alerte from "@/components/_commons/Alerte/Alerte";
import { typeAlerte } from "@/components/_commons/Alerte/Alerte.interface";

export const SYNTHESE_ACTIONS = [
  "publication-reussie",
  "modification-reussie",
  "brouillon-enregistre",
  "",
] as const;

export type SyntheseDesResultatsAction = (typeof SYNTHESE_ACTIONS)[number];

const ALERTES: Record<
  Exclude<SyntheseDesResultatsAction, "">,
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

export const AlerteSyntheseDesResultats: FunctionComponent = () => {
  const [action] = useQueryState(
    "_action",
    parseAsStringLiteral(SYNTHESE_ACTIONS),
  );

  if (!action || !(action in ALERTES)) return null;

  const { message, type } = ALERTES[action as keyof typeof ALERTES];

  return (
    <div className="fr-mb-2w">
      <Alerte titre={message} type={type} />
    </div>
  );
};
