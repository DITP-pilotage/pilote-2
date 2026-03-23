import { FunctionComponent } from "react";
import Alerte from "@/components/_commons/Alerte/Alerte";
import { typeAlerte } from "@/components/_commons/Alerte/Alerte.interface";

export type SyntheseDesResultatsAction =
  | "publication-reussie"
  | "modification-reussie";

const ALERTES: Record<
  SyntheseDesResultatsAction,
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
};

export const AlerteSyntheseDesResultats: FunctionComponent<{
  action: SyntheseDesResultatsAction | null;
}> = ({ action }) => {
  if (!action) return null;

  const { message, type } = ALERTES[action];

  return (
    <div className="fr-mb-2w">
      <Alerte titre={message} type={type} />
    </div>
  );
};
