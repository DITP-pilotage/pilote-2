import { ProfilCode } from '@/server/domain/utilisateur/Utilisateur.interface';
import { ScopeChantiers, HabilitationChantiers } from '@/server/domain/utilisateur/habilitation/Habilitation.interface';

export default interface FicheUtilisateurProps {
  utilisateur: {
    nom: string
    prénom: string
    email: string
    profil: ProfilCode
    dateModification?: string
    auteurModification?: string
    fonction: string | null
    habilitations: Record<ScopeChantiers, HabilitationChantiers> 
  } 
}
