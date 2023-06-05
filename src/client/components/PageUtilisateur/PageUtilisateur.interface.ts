import Utilisateur from '@/server/domain/utilisateur/Utilisateur.interface';
import { NextPageAdminUtilisateurProps } from 'pages/admin/utilisateur/[id]';

export default interface PageUtilisateurProps {
  utilisateur: Utilisateur
  chantiers: NextPageAdminUtilisateurProps['chantiers']
}
