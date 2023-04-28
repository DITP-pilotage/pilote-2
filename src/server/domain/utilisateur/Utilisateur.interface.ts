import Chantier from '@/server/domain/chantier/Chantier.interface';
import PérimètreMinistériel from '@/server/domain/périmètreMinistériel/PérimètreMinistériel.interface';

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

export const scopes = ['lecture', 'saisie.commentaire', 'saisie.indicateur'] as const;
export type Scope = typeof scopes[number];

type Utilisateur = {
  id: string
  nom: string
  prénom: string
  email: string
  profil: Profil
  scopes: {
    [key in Scope]: {
      scope: key,
      chantiers: Chantier['id'][]
      territoires: string[]
    }
  }
};

export type UtilisateurÀCréerOuMettreÀJour = Utilisateur & { 
  scopes: {
    [key in Scope]: {
      scope: key,
      chantiers: Chantier['id'][]
      périmètres: PérimètreMinistériel['id'][]
      territoires: string[]
    }
  } 
};

export default Utilisateur;
