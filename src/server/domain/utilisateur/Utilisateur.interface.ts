import { Habilitations, HabilitationsÀCréerOuMettreÀJour } from './habilitation/Habilitation.interface';

export const profils = [
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
  'REFERENT_DEPARTEMENT', 
  'PREFET_DEPARTEMENT', 
  'SERVICES_DECONCENTRES_DEPARTEMENT', 
  'DROM',
] as const;
export type Profil = typeof profils[number];

type Utilisateur = {
  id: string
  nom: string
  prénom: string
  email: string
  profil: Profil
  habilitations: Habilitations
};

export type UtilisateurÀCréerOuMettreÀJour =  { 
  id: string
  nom: string
  prénom: string
  email: string
  profil: Profil
  habilitations: HabilitationsÀCréerOuMettreÀJour
};

export default Utilisateur;
