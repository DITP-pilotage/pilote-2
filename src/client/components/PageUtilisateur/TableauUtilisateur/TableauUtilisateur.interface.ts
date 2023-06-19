import { Profil } from '@/server/domain/utilisateur/Utilisateur.interface';

export default interface TableauUtilisateurProps {
  utilisateur: {
    nom: string
    prénom: string
    email: string
    profil: Profil
    dateModification?: string
    auteurModification?: string
    fonction: string | null
  } 
}
