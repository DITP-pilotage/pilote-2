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
  'COORDINATEUR_REGION',
  'PREFET_REGION',
  'SERVICES_DECONCENTRES_REGION',
  'RESPONSABLE_REGION',
  'COORDINATEUR_DEPARTEMENT',
  'PREFET_DEPARTEMENT',
  'SERVICES_DECONCENTRES_DEPARTEMENT',
  'RESPONSABLE_DEPARTEMENT',
  'DROM',
] as const;

export type ProfilCode = typeof profilsCodes[number];

export const profilsTerritoriaux = [
  'COORDINATEUR_REGION',
  'PREFET_REGION',
  'SERVICES_DECONCENTRES_REGION',
  'RESPONSABLE_REGION',
  'COORDINATEUR_DEPARTEMENT',
  'PREFET_DEPARTEMENT',
  'SERVICES_DECONCENTRES_DEPARTEMENT',
  'RESPONSABLE_DEPARTEMENT',
  'DROM',
] as const;

export const profilsDépartementaux = ['PREFET_DEPARTEMENT', 'COORDINATEUR_DEPARTEMENT', 'SERVICES_DECONCENTRES_DEPARTEMENT', 'RESPONSABLE_DEPARTEMENT'];
export const profilsRégionaux = ['PREFET_REGION', 'COORDINATEUR_REGION', 'SERVICES_DECONCENTRES_REGION', 'RESPONSABLE_REGION'];

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
