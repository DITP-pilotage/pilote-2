import { ProfilEnum } from '@/server/app/enum/profil.enum';
import { Habilitations, HabilitationsÀCréerOuMettreÀJour } from './habilitation/Habilitation.interface';

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
  ProfilEnum.RESPONSABLE_REGION,
  ProfilEnum.COORDINATEUR_DEPARTEMENT,
  ProfilEnum.PREFET_DEPARTEMENT,
  ProfilEnum.SERVICES_DECONCENTRES_DEPARTEMENT,
  ProfilEnum.RESPONSABLE_DEPARTEMENT,
  ProfilEnum.DROM,
] as const;

export type ProfilCode = typeof profilsCodes[number];

export const profilsTerritoriaux = [
  ProfilEnum.COORDINATEUR_REGION,
  ProfilEnum.PREFET_REGION,
  ProfilEnum.SERVICES_DECONCENTRES_REGION,
  ProfilEnum.RESPONSABLE_REGION,
  ProfilEnum.COORDINATEUR_DEPARTEMENT,
  ProfilEnum.PREFET_DEPARTEMENT,
  ProfilEnum.SERVICES_DECONCENTRES_DEPARTEMENT,
  ProfilEnum.RESPONSABLE_DEPARTEMENT,
  ProfilEnum.DROM,
] as const;

export const profilsDépartementaux = [ProfilEnum.PREFET_DEPARTEMENT, ProfilEnum.COORDINATEUR_DEPARTEMENT, ProfilEnum.SERVICES_DECONCENTRES_DEPARTEMENT, ProfilEnum.RESPONSABLE_DEPARTEMENT];
export const profilsRégionaux = [ProfilEnum.PREFET_REGION, ProfilEnum.COORDINATEUR_REGION, ProfilEnum.SERVICES_DECONCENTRES_REGION, ProfilEnum.RESPONSABLE_REGION];

type Utilisateur = {
  id: string
  nom: string
  prénom: string
  email: string
  profil: ProfilCode
  dateModification: string
  auteurModification: string
  dateCreation: string | null
  auteurCreation: string | null
  fonction: string | null
  saisieIndicateur: boolean
  saisieCommentaire: boolean
  gestionUtilisateur: boolean
  habilitations: Habilitations
};

export type UtilisateurÀCréerOuMettreÀJour =  {
  nom: string
  prénom: string
  email: string
  fonction: string | null
  profil: ProfilCode
  saisieIndicateur: boolean
  saisieCommentaire: boolean
  gestionUtilisateur: boolean
  habilitations: HabilitationsÀCréerOuMettreÀJour
};

export type UtilisateurÀCréerOuMettreÀJourSansHabilitation =  {
  nom: string
  prénom: string
  email: string
  fonction: string | null
  profil: ProfilCode,
  saisieIndicateur: boolean
  saisieCommentaire: boolean
  gestionUtilisateur: boolean
};

export default Utilisateur;
