import { Habilitations, HabilitationsÀCréerOuMettreÀJour } from './habilitation/Habilitation.interface';

export const profilsCodes = [
  'DITP_ADMIN',
  'DITP_PILOTAGE',
  'PR',
  'PM_ET_CABINET',
  'CABINET_MTFP',
  'CABINET_MINISTERIEL',
  'DIR_ADMIN_CENTRALE',
  'SECRETARIAT_GENERAL',
  'EQUIPE_DIR_PROJET',
  'DIR_PROJET',
  'REFERENT_REGION',
  'PREFET_REGION',
  'SERVICES_DECONCENTRES_REGION',
  'RESPONSABLE_REGION',
  'REFERENT_DEPARTEMENT',
  'PREFET_DEPARTEMENT',
  'SERVICES_DECONCENTRES_DEPARTEMENT',
  'RESPONSABLE_DEPARTEMENT',
  'DROM',
] as const;

export type ProfilCode = typeof profilsCodes[number];

export const profilsTerritoriaux = [
  'REFERENT_REGION',
  'PREFET_REGION',
  'SERVICES_DECONCENTRES_REGION',
  'RESPONSABLE_REGION',
  'REFERENT_DEPARTEMENT',
  'PREFET_DEPARTEMENT',
  'SERVICES_DECONCENTRES_DEPARTEMENT',
  'RESPONSABLE_DEPARTEMENT',
  'DROM',
] as const;

export const profilsDépartementaux = ['PREFET_DEPARTEMENT', 'REFERENT_DEPARTEMENT', 'SERVICES_DECONCENTRES_DEPARTEMENT', 'RESPONSABLE_DEPARTEMENT'] as const;
export const profilsRégionaux = ['PREFET_REGION', 'REFERENT_REGION', 'SERVICES_DECONCENTRES_REGION', 'SERVICES_DECONCENTRES_REGION', 'RESPONSABLE_REGION'] as const;

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
};

export default Utilisateur;
