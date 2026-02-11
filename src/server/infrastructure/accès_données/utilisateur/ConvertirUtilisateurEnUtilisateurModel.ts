import { utilisateur } from "@prisma/client";

export const convertirEnModel = (utilisateurAConvertir: {
  email: string;
  nom: string;
  prenom: string;
  profilCode: string;
  fonction: string | null;
  ministere: string | null;
  service: string | null;
  serviceAutre: string | null;
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
  | "applications_accessibles"
  | "date_visualisation_video_accueil"
  | "date_visualisation_popup_infolettre"
  | "date_inscription_infolettre"
  | "date_premiere_relance_desactivation"
  | "date_deuxieme_relance_desactivation"
  | "date_desactivation_programee"
  | "date_derniere_connexion"
> => {
  return {
    email: utilisateurAConvertir.email,
    nom: utilisateurAConvertir.nom,
    prenom: utilisateurAConvertir.prenom,
    profilCode: utilisateurAConvertir.profilCode,
    fonction: utilisateurAConvertir.fonction,
    ministere: utilisateurAConvertir.ministere,
    service: utilisateurAConvertir.service,
    service_autre: utilisateurAConvertir.serviceAutre,
    auteur_id_modification: utilisateurAConvertir.auteurIdModification,
    date_modification: utilisateurAConvertir.dateModification,
    auteur_id_creation: utilisateurAConvertir.auteurIdCreation,
    date_creation: utilisateurAConvertir.dateCreation,
  };
};
