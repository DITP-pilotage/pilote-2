import { Habilitations } from '@/server/domain/utilisateur/habilitation/Habilitation.interface';
import { ProfilCode } from '@/server/domain/utilisateur/Utilisateur.interface';

export interface UtilisateurListeGestion {
  id: string
  email: string
  nom: string
  prénom: string
  fonction: string | null
  habilitations: Habilitations
  dateModification: string
  auteurModification: string
  profil: ProfilCode
}
