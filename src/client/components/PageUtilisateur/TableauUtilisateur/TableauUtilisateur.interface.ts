import { ProfilCode } from '@/server/domain/utilisateur/Utilisateur.interface';

export default interface TableauUtilisateurProps {
  utilisateur: {
    nom: string
    prénom: string
    email: string
    profil: ProfilCode
    dateModification?: string
    auteurModification?: string
    dateCreation?: string
    auteurCreation?: string
    fonction: string | null
  } 
}
