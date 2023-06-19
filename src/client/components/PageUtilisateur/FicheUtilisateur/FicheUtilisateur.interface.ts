import { Profil } from '@/server/domain/utilisateur/Utilisateur.interface';
import { ScopeChantiers, HabilitationChantiers } from '@/server/domain/utilisateur/habilitation/Habilitation.interface';
import { NextPageAdminUtilisateurProps } from 'pages/admin/utilisateur/[id]';

export default interface FicheUtilisateurProps {
  utilisateur: {
    nom: string
    prénom: string
    email: string
    profil: Profil
    dateModification?: string
    auteurModification?: string
    fonction: string | null
    habilitations: Record<ScopeChantiers, HabilitationChantiers> 
  } 
  chantiers: NextPageAdminUtilisateurProps['chantiers']
}
