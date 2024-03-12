import { ProfilCode } from '@/server/domain/utilisateur/Utilisateur.interface';

export default interface TableauUtilisateurProps {
  utilisateur: {
    nom: string
    prénom: string
    email: string
    profil: ProfilCode
    dateModification?: string | null
    auteurModification?: string | null
    fonction: string | null
  } 
}
