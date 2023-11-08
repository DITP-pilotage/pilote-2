import Chantier from '@/server/domain/chantier/Chantier.interface';
import PérimètreMinistériel from '@/server/domain/périmètreMinistériel/PérimètreMinistériel.interface';
import { Territoire } from '@/server/domain/territoire/Territoire.interface';
import { ProfilCode } from '@/server/domain/utilisateur/Utilisateur.interface';

export default interface FicheUtilisateurProps {
  utilisateur: {
    nom: string
    prénom: string
    email: string
    profil: ProfilCode
    dateModification?: string
    auteurModification?: string
    fonction: string | null
    habilitations?: {
      lecture?: {
        chantiers?: Chantier['id'][]
        territoires?: Territoire['code'][]
        périmètres?: PérimètreMinistériel['id'][]
      },
      saisieIndicateur?: {
        chantiers?: Chantier['id'][]
        périmètres?: PérimètreMinistériel['id'][]          
      },
      saisieCommentaire?: {
        chantiers?: Chantier['id'][]
        périmètres?: PérimètreMinistériel['id'][]          
      }
    }
  } 
}
