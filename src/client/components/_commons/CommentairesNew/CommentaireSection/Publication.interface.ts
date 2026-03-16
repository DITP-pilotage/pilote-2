import { SubmitHandler } from "react-hook-form";

export interface PublicationAvecAuteur {
  contenu: string;
  dateCreation: string;
  dateModification: string;
  auteurModificationNom: string;
}

export interface BrouillonPublication {
  id: string;
  contenu: string;
  dateModification: string;
}

export interface PublicationActions {
  publier: SubmitHandler<{ contenu: string }>;
  enregistrerEnBrouillon: SubmitHandler<{ contenu: string }>;
  publierBrouillon: SubmitHandler<{ contenu: string }>;
  modifierBrouillon: SubmitHandler<{ contenu: string }>;
  modifier: SubmitHandler<{ contenu: string }>;
}
