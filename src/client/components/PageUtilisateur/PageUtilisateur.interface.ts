import Utilisateur from '@/server/domain/utilisateur/Utilisateur.interface';
import Chantier from '@/server/domain/chantier/Chantier.interface';

export default interface PageUtilisateurProps {
  utilisateur: Utilisateur
  chantiers: Record<Chantier['id'], Chantier['nom']>
}
