import { SubmitHandler } from "react-hook-form";

export interface Publication {
  contenu: string;
  contenuHtml?: string | null;
  dateCreation: string;
  dateModification: string;
  auteurCreationNom: string;
  auteurModificationNom: string;
}

export interface PublicationBrouillon {
  id: string;
  contenu: string;
  contenuHtml?: string | null;
  dateModification: string;
}

export interface PublicationActions {
  publier: SubmitHandler<{ contenu: string }>;
  enregistrerEnBrouillon: SubmitHandler<{ contenu: string }>;
  publierBrouillon: SubmitHandler<{ contenu: string }>;
  modifierBrouillon: SubmitHandler<{ contenu: string }>;
  modifier: SubmitHandler<{ contenu: string }>;
}
