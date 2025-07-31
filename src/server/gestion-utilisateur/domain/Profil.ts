import { ProfilEnum } from "@/server/app/enum/profil.enum";

export const profilsCodes = [
  ProfilEnum.DITP_ADMIN,
  ProfilEnum.DITP_PILOTAGE,
  ProfilEnum.PR,
  ProfilEnum.PM_ET_CABINET,
  ProfilEnum.CABINET_MTFP,
  ProfilEnum.CABINET_MINISTERIEL,
  ProfilEnum.DIR_ADMIN_CENTRALE,
  ProfilEnum.SECRETARIAT_GENERAL,
  ProfilEnum.EQUIPE_DIR_PROJET,
  ProfilEnum.DIR_PROJET,
  ProfilEnum.COORDINATEUR_REGION,
  ProfilEnum.PREFET_REGION,
  ProfilEnum.SERVICES_DECONCENTRES_REGION,
  ProfilEnum.COORDINATEUR_DEPARTEMENT,
  ProfilEnum.PREFET_DEPARTEMENT,
  ProfilEnum.SERVICES_DECONCENTRES_DEPARTEMENT,
  ProfilEnum.DROM,
] as const;

export type ProfilCode = (typeof profilsCodes)[number];

export type Profil = {
  code: ProfilCode;
  nom: string;
  chantiers: {
    lecture: {
      tous: boolean;
      tousTerritorialisés: boolean;
      tousTerritoires: boolean;
      brouillons: boolean;
    };
    saisieCommentaire: {
      tousTerritoires: boolean;
      saisiePossible: boolean;
    };
    saisieIndicateur: {
      tousTerritoires: boolean;
    };
  };
  utilisateurs: {
    modificationPossible: boolean;
    tousTerritoires: boolean;
    tousChantiers: boolean;
  };
};
