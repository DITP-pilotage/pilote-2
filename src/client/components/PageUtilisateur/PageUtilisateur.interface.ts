import Utilisateur from '@/server/domain/utilisateur/Utilisateur.interface';
import { TokenAPIInformationContrat } from '@/server/authentification/app/contrats/TokenAPIInformationContrat';

export default interface PageUtilisateurProps {
  utilisateur: Utilisateur,
  tokenAPIInformation : TokenAPIInformationContrat
}
