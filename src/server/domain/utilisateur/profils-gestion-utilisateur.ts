import { ProfilEnum } from "@/server/app/enum/profil.enum";
import { Profil } from "@/server/gestion-utilisateur/domain/Profil";

export const AAccesATousLesUtilisateurs = (profil: Profil | null) => {
  if (profil) {
    return (
      profil.utilisateurs.tousChantiers && profil.utilisateurs.tousTerritoires
    );
  }

  return false;
};

export const PROFILS_POSSIBLES_GESTION_UTILISATEUR_MODIFICATION = {
  COORDINATEUR_REGION: [
    ProfilEnum.PREFET_REGION,
    ProfilEnum.PREFET_DEPARTEMENT,
    ProfilEnum.SERVICES_DECONCENTRES_REGION,
    ProfilEnum.SERVICES_DECONCENTRES_DEPARTEMENT,
  ],
  COORDINATEUR_DEPARTEMENT: [
    ProfilEnum.PREFET_DEPARTEMENT,
    ProfilEnum.SERVICES_DECONCENTRES_DEPARTEMENT,
  ],
  SECRETARIAT_GENERAL: [
    ProfilEnum.SERVICES_DECONCENTRES_REGION,
    ProfilEnum.SERVICES_DECONCENTRES_DEPARTEMENT,
  ],
};

export const PROFILS_POSSIBLES_GESTION_UTILISATEUR_LECTURE = {
  COORDINATEUR_REGION: [
    ProfilEnum.PREFET_REGION,
    ProfilEnum.PREFET_DEPARTEMENT,
    ProfilEnum.SERVICES_DECONCENTRES_REGION,
    ProfilEnum.SERVICES_DECONCENTRES_DEPARTEMENT,
    ProfilEnum.COORDINATEUR_DEPARTEMENT,
    ProfilEnum.COORDINATEUR_REGION,
  ],
  COORDINATEUR_DEPARTEMENT: [
    ProfilEnum.PREFET_DEPARTEMENT,
    ProfilEnum.SERVICES_DECONCENTRES_DEPARTEMENT,
    ProfilEnum.COORDINATEUR_DEPARTEMENT,
  ],
  SECRETARIAT_GENERAL: [
    ProfilEnum.SERVICES_DECONCENTRES_REGION,
    ProfilEnum.SERVICES_DECONCENTRES_DEPARTEMENT,
  ],
};

export const PROFILS_POSSIBLES_RESPONSABLES = new Set([
  ProfilEnum.PREFET_REGION,
  ProfilEnum.PREFET_DEPARTEMENT,
  ProfilEnum.SERVICES_DECONCENTRES_REGION,
  ProfilEnum.SERVICES_DECONCENTRES_DEPARTEMENT,
  ProfilEnum.COORDINATEUR_DEPARTEMENT,
  ProfilEnum.COORDINATEUR_REGION,
  ProfilEnum.EQUIPE_DIR_PROJET,
]);
