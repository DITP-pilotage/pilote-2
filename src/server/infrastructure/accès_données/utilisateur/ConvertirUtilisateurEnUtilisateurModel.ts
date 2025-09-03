import { utilisateur } from "@prisma/client";

export const convertirEnModel = (utilisateurAConvertir: {
  email: string;
  nom: string;
  prenom: string;
  profilCode: string;
  fonction: string | null;
  auteurIdModification: string;
  dateModification: Date;
  auteurIdCreation: string;
  dateCreation: Date;
}): Omit<
  utilisateur,
  | "id"
  | "auteur_email_creation"
  | "auteur_email_modification"
  | "date_desactivation"
  | "date_visualisation_video_accueil"
  | "date_visualisation_popup_infolettre"
  | "date_inscription_infolettre"
> => {
  return {
    email: utilisateurAConvertir.email,
    nom: utilisateurAConvertir.nom,
    prenom: utilisateurAConvertir.prenom,
    profilCode: utilisateurAConvertir.profilCode,
    fonction: utilisateurAConvertir.fonction,
    auteur_id_modification: utilisateurAConvertir.auteurIdModification,
    date_modification: utilisateurAConvertir.dateModification,
    auteur_id_creation: utilisateurAConvertir.auteurIdCreation,
    date_creation: utilisateurAConvertir.dateCreation,
  };
};
