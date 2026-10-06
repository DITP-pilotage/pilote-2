import { Territoire } from "@/shared/territoire/Territoire.interface";
import {
  profilsDépartementaux,
  profilsTerritoriaux,
} from "@/shared/utilisateur/Utilisateur.interface";
import { ProfilCode } from "@/server/gestion-utilisateur/domain/Profil";
import { Habilitations } from "@/server/gestion-utilisateur/domain/habilitation/Habilitation.interface";

export const recupererLesNomsDesTerritoires = (
  utilisateurProfil: ProfilCode,
  utilisateurHabilitation: Habilitations,
  territoiresListe: Territoire[],
): string[] => {
  if (!profilsTerritoriaux.includes(utilisateurProfil)) {
    return ["Tous les territoires"];
  }

  const maillesUtilisateur = profilsDépartementaux.includes(utilisateurProfil)
    ? ["departementale", "nationale"]
    : ["regionale", "nationale"];

  return territoiresListe
    .filter(
      (territoire) =>
        utilisateurHabilitation.lecture.territoires.includes(territoire.code) &&
        maillesUtilisateur.includes(territoire.maille),
    )
    .map((territoire) => territoire.nom);
};
