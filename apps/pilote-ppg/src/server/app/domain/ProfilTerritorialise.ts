import { ProfilEnum } from "@/shared/profil/ProfilEnum";

export const LISTE_PROFIL_TERRITORIALISE = [
  ProfilEnum.COORDINATEUR_REGION,
  ProfilEnum.PREFET_REGION,
  ProfilEnum.COORDINATEUR_DEPARTEMENT,
  ProfilEnum.PREFET_DEPARTEMENT,
  ProfilEnum.SERVICES_DECONCENTRES_DEPARTEMENT,
  ProfilEnum.SERVICES_DECONCENTRES_REGION,
];

export const estUnProfilTerritorialise = (
  profilAVerifier: ProfilEnum,
): boolean => LISTE_PROFIL_TERRITORIALISE.includes(profilAVerifier);
